import MemoEditor from "@/components/MemoEditor";

export default async function MemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemoEditor memoId={id} />;
}
