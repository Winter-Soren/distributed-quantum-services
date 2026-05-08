"use client";

import { useState } from "react";
import { Share2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIpfsUpload } from "../hooks/use-ipfs-upload";
import { PinButton } from "@/features/vault-pinning/components/pin-button";

interface ShareToVaultButtonProps {
  data: Record<string, unknown>;
  name: string;
  type: "circuit" | "run";
}

export function ShareToVaultButtonInner({ data, name, type }: ShareToVaultButtonProps) {
  const { upload, uploading, ready, heliaStatus } = useIpfsUpload();
  const [sharedCid, setSharedCid] = useState<string | null>(null);

  const handleShare = async () => {
    if (!ready) {
      toast.warning(heliaStatus);
      return;
    }
    const cid = await upload(data, name, type);
    if (cid) {
      setSharedCid(cid);
      toast.success("Shared to VAULT via IPFS");
    } else {
      toast.error("Failed to share to VAULT");
    }
  };

  if (sharedCid) {
    return <PinButton cid={sharedCid} type={type} metadata={{ name, ...data }} />;
  }

  const btn = (
    <button
      onClick={handleShare}
      disabled={uploading}
      className={cn(
        "group relative inline-flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-md",
        "border border-cyan-500/25 bg-cyan-500/8 px-3 py-1.5",
        "text-[12px] font-medium text-cyan-400 transition-all duration-200",
        "hover:border-cyan-500/50 hover:bg-cyan-500/15 hover:text-cyan-300",
        uploading && "cursor-not-allowed opacity-60",
      )}
    >
      {/* Shimmer sweep */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/12 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {uploading ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : (
        <Share2 className="h-3 w-3 shrink-0 animate-pulse" />
      )}
      <span>{uploading ? "Sharing..." : "Share to VAULT"}</span>
      {!ready && !uploading && (
        <XCircle className="h-3 w-3 shrink-0 text-rose-400" />
      )}
    </button>
  );

  if (!ready) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-56 text-center text-xs">
            {heliaStatus}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return btn;
}
