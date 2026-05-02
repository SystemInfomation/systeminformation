-- Simple family picks: name (via profiles) + top 3 horses, no money.

CREATE TABLE public.top3_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pick_first UUID NOT NULL REFERENCES public.horses (id) ON DELETE CASCADE,
  pick_second UUID NOT NULL REFERENCES public.horses (id) ON DELETE CASCADE,
  pick_third UUID NOT NULL REFERENCES public.horses (id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

CREATE INDEX top3_picks_game_id_idx ON public.top3_picks (game_id);

ALTER TABLE public.top3_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY top3_picks_select_game ON public.top3_picks FOR SELECT TO authenticated
  USING (
    game_id IN (SELECT game_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY top3_picks_insert_own ON public.top3_picks FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND game_id IN (SELECT game_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY top3_picks_update_own ON public.top3_picks FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
