-- Kentucky Derby Family Betting (fake money) — initial schema
-- Run in Supabase SQL editor or via supabase db push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.game_status AS ENUM ('open', 'locked', 'settled');
CREATE TYPE public.bet_type AS ENUM ('win', 'place', 'show', 'exacta', 'trifecta');
CREATE TYPE public.bet_status AS ENUM ('pending', 'won', 'lost');

CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  race_start_at TIMESTAMPTZ NOT NULL,
  betting_locked_at TIMESTAMPTZ,
  status public.game_status NOT NULL DEFAULT 'open',
  starting_balance NUMERIC(12, 2) NOT NULL DEFAULT 1000,
  place_payout_ratio NUMERIC(8, 4) NOT NULL DEFAULT 0.35,
  show_payout_ratio NUMERIC(8, 4) NOT NULL DEFAULT 0.20,
  exacta_multiplier NUMERIC(12, 4) NOT NULL DEFAULT 12,
  trifecta_multiplier NUMERIC(12, 4) NOT NULL DEFAULT 48,
  ai_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  starting_balance NUMERIC(12, 2) NOT NULL,
  current_balance NUMERIC(12, 2) NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🐎',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id),
  UNIQUE (game_id, display_name)
);

CREATE INDEX profiles_game_id_idx ON public.profiles (game_id);
CREATE INDEX profiles_user_id_idx ON public.profiles (user_id);

CREATE TABLE public.horses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
  post_position INTEGER NOT NULL,
  name TEXT NOT NULL,
  jockey TEXT,
  trainer TEXT,
  odds_num INTEGER NOT NULL DEFAULT 5,
  odds_den INTEGER NOT NULL DEFAULT 1,
  model_win_prob NUMERIC(8, 5),
  ai_confidence TEXT,
  scratched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, post_position)
);

CREATE INDEX horses_game_id_idx ON public.horses (game_id);

CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
  type public.bet_type NOT NULL,
  stake NUMERIC(12, 2) NOT NULL,
  horse_ids UUID[] NOT NULL,
  odds_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.bet_status NOT NULL DEFAULT 'pending',
  payout NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bets_game_id_idx ON public.bets (game_id);
CREATE INDEX bets_user_id_idx ON public.bets (user_id);

CREATE TABLE public.race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL UNIQUE REFERENCES public.games (id) ON DELETE CASCADE,
  positions UUID[] NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_game_id_idx ON public.messages (game_id);

-- --- RLS ---
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY games_select_all ON public.games FOR SELECT USING (true);

CREATE POLICY horses_select_all ON public.horses FOR SELECT USING (true);

CREATE POLICY race_results_select_game ON public.race_results FOR SELECT TO authenticated
  USING (
    game_id IN (SELECT game_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY profiles_select_same_game ON public.profiles FOR SELECT TO authenticated
  USING (
    game_id IN (SELECT game_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Profile updates (balances, avatars) go through service role / admin APIs only.

CREATE POLICY bets_select_same_game ON public.bets FOR SELECT TO authenticated
  USING (
    game_id IN (SELECT game_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY messages_select_same_game ON public.messages FOR SELECT TO authenticated
  USING (
    game_id IN (SELECT game_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY messages_insert_own ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND game_id IN (SELECT game_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Atomic bet placement (deduct balance + insert bet)
CREATE OR REPLACE FUNCTION public.place_bet(
  p_game_id uuid,
  p_type public.bet_type,
  p_stake numeric,
  p_horse_ids uuid[],
  p_odds_snapshot jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_bet_id uuid;
  v_game public.games%ROWTYPE;
  v_balance numeric;
  v_need int;
  h uuid;
  cnt int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_game FROM public.games WHERE id = p_game_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'game not found';
  END IF;
  IF v_game.status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'betting closed';
  END IF;

  SELECT current_balance INTO v_balance
  FROM public.profiles
  WHERE user_id = v_uid AND game_id = p_game_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no profile for this game';
  END IF;

  IF p_stake IS NULL OR p_stake <= 0 OR p_stake > v_balance THEN
    RAISE EXCEPTION 'invalid stake';
  END IF;

  v_need := CASE p_type
    WHEN 'win' THEN 1
    WHEN 'place' THEN 1
    WHEN 'show' THEN 1
    WHEN 'exacta' THEN 2
    WHEN 'trifecta' THEN 3
  END;

  IF p_horse_ids IS NULL OR array_length(p_horse_ids, 1) IS DISTINCT FROM v_need THEN
    RAISE EXCEPTION 'wrong number of horses for bet type';
  END IF;

  FOREACH h IN ARRAY p_horse_ids LOOP
    SELECT COUNT(*) INTO cnt FROM public.horses
    WHERE id = h AND game_id = p_game_id AND scratched = false;
    IF cnt = 0 THEN
      RAISE EXCEPTION 'invalid or scratched horse';
    END IF;
  END LOOP;

  UPDATE public.profiles
  SET current_balance = current_balance - p_stake
  WHERE user_id = v_uid AND game_id = p_game_id;

  INSERT INTO public.bets (user_id, game_id, type, stake, horse_ids, odds_snapshot)
  VALUES (v_uid, p_game_id, p_type, p_stake, p_horse_ids, COALESCE(p_odds_snapshot, '{}'::jsonb))
  RETURNING id INTO v_bet_id;

  RETURN v_bet_id;
END;
$$;

REVOKE ALL ON FUNCTION public.place_bet(uuid, public.bet_type, numeric, uuid[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_bet(uuid, public.bet_type, numeric, uuid[], jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bet(uuid, public.bet_type, numeric, uuid[], jsonb) TO service_role;

-- Seed game + sample horses (edit for your party)
INSERT INTO public.games (slug, name, race_start_at, status, ai_summary)
VALUES (
  'derby-2026',
  'Family Derby 2026',
  (date_trunc('day', now() AT TIME ZONE 'America/New_York') + interval '18 hours 50 minutes') AT TIME ZONE 'America/New_York',
  'open',
  jsonb_build_object(
    'topWinner', 'Commandment',
    'sleeper', 'Albus',
    'overrated', 'Chief Wallabee',
    'darkHorse', 'Danon Bourbon',
    'updatedAt', to_jsonb(now())
  )
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.horses (game_id, post_position, name, jockey, trainer, odds_num, odds_den, model_win_prob, ai_confidence)
SELECT g.id, v.post_position, v.name, v.jockey, v.trainer, v.odds_num, v.odds_den, v.model_win_prob, v.ai_confidence
FROM public.games g
CROSS JOIN (VALUES
  (1, 'Renegade', 'Irad Ortiz Jr.', 'Todd Pletcher', 6, 1, 0.115, 'High'),
  (2, 'Albus', 'Manny Franco', 'Riley Mott', 44, 1, 0.037, 'Medium'),
  (3, 'Intrepido', 'Hector Berrios', 'Jeff Mullins', 46, 1, 0.020, 'Low'),
  (4, 'Litmus Test', 'Martin Garcia', 'Bob Baffert', 26, 1, 0.028, 'Medium'),
  (6, 'Commandment', 'Luis Saez', 'Brad Cox', 5, 1, 0.126, 'High'),
  (7, 'Danon Bourbon', 'Atsuya Nishimura', 'Manabu Ikezoe', 14, 1, 0.051, 'Medium'),
  (8, 'So Happy', 'Mike Smith', 'Mark Glatt', 5, 1, 0.112, 'High'),
  (10, 'Wonder Dean', 'Ryusei Sakai', 'Daisuke Takayanagi', 24, 1, 0.030, 'Low'),
  (11, 'Incredibolt', 'Jaime Torres', 'Riley Mott', 24, 1, 0.034, 'Medium'),
  (12, 'Chief Wallabee', 'Junior Alvarado', 'Bill Mott', 6, 1, 0.087, 'Medium'),
  (14, 'Potente', 'Juan Hernandez', 'Bob Baffert', 20, 1, 0.045, 'Medium'),
  (15, 'Emerging Market', 'Flavien Prat', 'Chad Brown', 9, 1, 0.075, 'High'),
  (16, 'Pavlovian', 'Edwin Maldonado', 'Doug O''Neill', 46, 1, 0.027, 'Low'),
  (17, 'Six Speed', 'Brian Hernandez Jr.', 'Bhupat Seemar', 33, 1, 0.025, 'Low'),
  (18, 'Further Ado', 'John Velazquez', 'Brad Cox', 6, 1, 0.107, 'High'),
  (19, 'Golden Tempo', 'José Ortiz', 'Cherie DeVaux', 25, 1, 0.034, 'Medium'),
  (21, 'Great White', 'Alex Achard', 'John Ennis', 22, 1, 0.030, 'Low'),
  (22, 'Ocelli', 'Tyler Gaffalione', 'Whit Beckman', 84, 1, 0.012, 'Low'),
  (23, 'Robusta', 'Cristian Torres', 'Doug O''Neill', 83, 1, 0.012, 'Low')
) AS v(post_position, name, jockey, trainer, odds_num, odds_den, model_win_prob, ai_confidence)
WHERE g.slug = 'derby-2026'
ON CONFLICT (game_id, post_position) DO NOTHING;

-- Realtime: in Supabase Dashboard, add `messages` to the `supabase_realtime` publication if needed.
