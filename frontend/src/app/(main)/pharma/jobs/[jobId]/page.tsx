import { PharmaJobDetail } from "@/features/pharma/components/pharma-job-detail";

export default async function PharmaJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <PharmaJobDetail jobId={jobId} />;
}
