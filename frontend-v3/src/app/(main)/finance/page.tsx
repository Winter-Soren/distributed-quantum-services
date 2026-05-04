import { PortfolioUploadPanel } from "@/features/finance/components/portfolio-upload-panel";

export default function FinancePage() {
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-normal text-foreground">
        Financial Analysis
      </h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Upload a portfolio CSV to run quantum portfolio optimization and factor
        analysis.
      </p>
      <PortfolioUploadPanel />
    </div>
  );
}
