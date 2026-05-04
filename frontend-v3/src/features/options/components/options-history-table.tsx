"use client";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import type { OptionsJobSummary } from "../types";

interface OptionsHistoryTableProps {
  jobs: OptionsJobSummary[];
  className?: string;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "processing" || status === "queued") return "secondary";
  return "outline";
}

export function OptionsHistoryTable({
  jobs,
  className,
}: OptionsHistoryTableProps) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No options jobs yet.
      </p>
    );
  }

  return (
    <Table className={cn(className)}>
      <TableHeader>
        <TableRow>
          <TableHead>Job ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="sr-only">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.jobId}>
            <TableCell className="font-mono text-xs">{job.jobId}</TableCell>
            <TableCell>{job.optionType}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(job.createdAt).toLocaleString()}
            </TableCell>
            <TableCell>
              <Link
                href={ROUTES.optionsDetail(job.jobId)}
                className="text-sm underline underline-offset-4 text-foreground hover:text-muted-foreground"
              >
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
