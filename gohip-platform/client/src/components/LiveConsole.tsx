/**
 * GOHIP Platform - Live Console Modal
 * ====================================
 * 
 * Phase 9: Data Engine - "The Matrix" Console
 * 
 * A terminal-style modal that displays real-time ETL pipeline logs
 * with a dark hacker aesthetic (green text on black background).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Terminal, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { apiClient } from "../services/api";

interface LiveConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PipelineLogsResponse {
  logs: string[];
  is_running: boolean;
  started_at: string | null;
  finished_at: string | null;
  log_count: number;
}

export function LiveConsole({ isOpen, onClose }: LiveConsoleProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to bottom when new logs arrive
  const scrollToBottom = useCallback(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  // Fetch logs from the API
  const fetchLogs = useCallback(async () => {
    try {
      const response = await apiClient.get<PipelineLogsResponse>("/api/v1/etl/logs");
      const data = response.data;
      
      setLogs(data.logs);
      setIsRunning(data.is_running);
      
      // Check if pipeline just finished
      if (!data.is_running && data.finished_at && data.logs.length > 0) {
        setIsFinished(true);
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  }, []);

  // Start the pipeline
  const startPipeline = useCallback(async () => {
    setIsStarting(true);
    setIsFinished(false);
    setError(null);
    setLogs([]);
    
    try {
      const response = await apiClient.post("/api/v1/etl/run");
      
      if (response.data.success) {
        setIsRunning(true);
        
        // Start polling for logs
        pollingRef.current = setInterval(fetchLogs, 1000);
        
        // Initial fetch
        await fetchLogs();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to start pipeline. Check server connection.");
      console.error("Failed to start pipeline:", err);
    } finally {
      setIsStarting(false);
    }
  }, [fetchLogs]);

  // Start pipeline when modal opens
  useEffect(() => {
    if (isOpen) {
      startPipeline();
    }
    
    return () => {
      // Cleanup polling on unmount
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, startPipeline]);

  // Handle close
  const handleClose = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setLogs([]);
    setIsRunning(false);
    setIsFinished(false);
    setError(null);
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-black border border-green-500/30 rounded-lg shadow-2xl shadow-green-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/30 bg-green-950/20">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-green-400" />
            <span className="font-mono text-green-400 text-sm font-medium">
              GOHIP::ETL_PIPELINE v1.0
            </span>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2 ml-4">
              {isStarting && (
                <>
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                  <span className="font-mono text-yellow-400 text-xs">INITIALIZING...</span>
                </>
              )}
              {isRunning && !isStarting && (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-mono text-green-400 text-xs">RUNNING</span>
                </>
              )}
              {isFinished && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="font-mono text-green-400 text-xs">COMPLETE</span>
                </>
              )}
              {error && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="font-mono text-red-400 text-xs">ERROR</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Retry button */}
            {isFinished && (
              <button
                onClick={startPipeline}
                className="p-1.5 text-green-400/70 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                title="Run Again"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-1.5 text-green-400/70 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Console Body */}
        <div className="h-[500px] overflow-y-auto p-4 font-mono text-sm bg-black scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-transparent">
          {/* Startup banner */}
          <div className="text-green-500/70 mb-4">
            <pre className="text-xs leading-tight">
{`╔══════════════════════════════════════════════════════════════╗
║  ██████╗  ██████╗ ██╗  ██╗██╗██████╗    ███████╗████████╗██╗  ║
║ ██╔════╝ ██╔═══██╗██║  ██║██║██╔══██╗   ██╔════╝╚══██╔══╝██║  ║
║ ██║  ███╗██║   ██║███████║██║██████╔╝   █████╗     ██║   ██║  ║
║ ██║   ██║██║   ██║██╔══██║██║██╔═══╝    ██╔══╝     ██║   ██║  ║
║ ╚██████╔╝╚██████╔╝██║  ██║██║██║        ███████╗   ██║   ███████╗
║  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝        ╚══════╝   ╚═╝   ╚══════╝
╠══════════════════════════════════════════════════════════════╣
║  Statistician ETL Pipeline - Data Synchronization Console    ║
╚══════════════════════════════════════════════════════════════╝`}
            </pre>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="text-red-400 mb-4 p-3 border border-red-500/30 rounded bg-red-950/20">
              <span className="font-bold">ERROR: </span>{error}
            </div>
          )}
          
          {/* Log entries */}
          <div className="space-y-0.5">
            {logs.map((log, index) => (
              <LogLine key={index} content={log} />
            ))}
            
            {/* Cursor */}
            {isRunning && (
              <div className="flex items-center gap-1 text-green-400">
                <span className="animate-pulse">█</span>
              </div>
            )}
          </div>
          
          {/* Scroll anchor */}
          <div ref={logsEndRef} />
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 border-t border-green-500/30 bg-green-950/20 flex items-center justify-between">
          <span className="font-mono text-green-500/50 text-xs">
            {logs.length} log entries
          </span>
          <span className="font-mono text-green-500/50 text-xs">
            Press ESC to close
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual log line with syntax highlighting
 */
function LogLine({ content }: { content: string }) {
  // Determine color based on content
  let colorClass = "text-green-400/90";
  
  if (content.includes("✓") || content.includes("SUCCESS") || content.includes("Finished Successfully")) {
    colorClass = "text-green-400";
  } else if (content.includes("✗") || content.includes("ERROR") || content.includes("crashed")) {
    colorClass = "text-red-400";
  } else if (content.includes("⚠") || content.includes("WARNING")) {
    colorClass = "text-yellow-400";
  } else if (content.includes("◆") || content.includes("[PHASE]")) {
    colorClass = "text-cyan-400 font-bold";
  } else if (content.includes("━") || content.includes("─") || content.includes("═")) {
    colorClass = "text-green-500/50";
  } else if (content.includes("→")) {
    colorClass = "text-green-400/70";
  }
  
  return (
    <div className={`${colorClass} whitespace-pre-wrap break-all`}>
      {content}
    </div>
  );
}

export default LiveConsole;
