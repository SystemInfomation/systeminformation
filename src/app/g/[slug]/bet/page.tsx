import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function BetRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/g/${slug}/pick`);
}
