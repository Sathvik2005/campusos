import { FeeAccountView } from "@/features/fees/fee-account-view";

export const metadata = { title: "Fee account · CampusOS" };

export default async function FeeAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FeeAccountView studentId={id} />;
}
