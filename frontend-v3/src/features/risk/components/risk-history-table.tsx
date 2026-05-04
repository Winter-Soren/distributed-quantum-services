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
import type { RiskJobSummary } from "../types";

interface RiskHistoryTableProps {
  jobs: RiskJobSummary[];
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

export function RiskHistoryTable({ jobs, className }: RiskHistoryTableProps) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No risk jobs yet.
      </p>
    );
  }

  return (
    <Table className={cn(className)}>
      <TableHeader>
        <TableRow>
          <TableHead>Job ID</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Portfolio Size</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="sr-only">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.jobId}>
            <TableCell className="font-mono text-xs">{job.jobId}</TableCell>
            <TableCell>{job.riskModel}</TableCell>
            <TableCell className="tabular-nums">{job.portfolioSize}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(job.createdAt).toLocaleString()}
            </TableCell>
            <TableCell>
              <Link
                href={ROUTES.riskDetail(job.jobId)}
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
