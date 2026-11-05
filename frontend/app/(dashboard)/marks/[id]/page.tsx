import { MarksDetailView } from "@/features/marks/marks-detail-view";

export const metadata = { title: "Marks · CampusOS" };

export default async function MarksDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarksDetailView id={id} />;
}
