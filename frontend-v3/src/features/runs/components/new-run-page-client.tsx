"use client";

import { RunCreateForm } from "./run-create-form";

export function NewRunPageClient() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">
          New Quantum Run
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Submit a QASM circuit for distributed execution.
        </p>
      </div>
      <div className="max-w-2xl">
        <RunCreateForm />
      </div>
    </div>
  );
}
