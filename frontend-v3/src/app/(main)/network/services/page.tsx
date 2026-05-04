import { ServiceTable } from "@/features/network/components/service-table";

export default function ServicesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Services</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Registered quantum services — type, fidelity, and qubit ranges.
        </p>
      </div>
      <ServiceTable />
    </div>
  );
}
