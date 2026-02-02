/**
 * Admin Regenerate Button Component
 * 
 * Button to force regenerate comparison report (admin only).
 */

import { motion } from "framer-motion";
import { RefreshCw, Shield, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

interface AdminRegenerateButtonProps {
  onRegenerate: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
  version?: number;
}

export function AdminRegenerateButton({
  onRegenerate,
  isLoading = false,
  lastUpdated,
  version,
}: AdminRegenerateButtonProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4"
    >
      {/* Version & Date Info */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        {version && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/50">
            <Shield className="w-3 h-3" />
            v{version}
          </span>
        )}
        {lastUpdated && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(lastUpdated)}
          </span>
        )}
      </div>

      {/* Regenerate Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRegenerate}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl",
          "bg-amber-500/20 border border-amber-500/30",
          "text-amber-400 font-medium text-sm",
          "hover:bg-amber-500/30 transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        {isLoading ? "Regenerating..." : "Regenerate Report"}
      </motion.button>

      {/* Admin Badge */}
      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
        <Shield className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] font-medium text-amber-400">Admin</span>
      </span>
    </motion.div>
  );
}

export default AdminRegenerateButton;
