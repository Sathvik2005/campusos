import { StudentDetailView } from "@/features/students/student-detail-view";

export const metadata = { title: "Student · CampusOS" };

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetailView id={id} />;
}
