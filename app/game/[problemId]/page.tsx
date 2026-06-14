import { GameScreen } from "@/components/GameScreen";

export default async function GamePage({ params }: { params: Promise<{ problemId: string }> }) {
  const { problemId } = await params;
  return <GameScreen problemId={problemId} />;
}
