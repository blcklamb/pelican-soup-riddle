import { ArchiveDetailScreen } from "@/components/ArchiveDetailScreen";

export default async function ArchiveDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <ArchiveDetailScreen sessionId={sessionId} />;
}
