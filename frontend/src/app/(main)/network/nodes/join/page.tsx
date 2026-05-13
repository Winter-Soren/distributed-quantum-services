import type { Metadata } from "next";
import { JoinPageClient } from "@/features/network/components/join-page-client";

export const metadata: Metadata = {
  title: "Join the Network",
};

export default function JoinPage() {
  return <JoinPageClient />;
}
