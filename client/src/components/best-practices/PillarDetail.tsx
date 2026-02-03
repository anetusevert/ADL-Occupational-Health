/**
 * Arthur D. Little - Global Health Platform
 * Pillar Detail Component - Shows questions for a pillar
 * 
 * Displays the 4 strategic questions for a selected pillar
 * with their completion status.
 */

import { motion } from "framer-motion";
import { 
  Crown, Shield, Eye, Heart, 
  ChevronLeft, ChevronRight, CheckCircle2, 
  Loader2, AlertCircle, Sparkles 
} from "lucide-react";
import { cn } from "../../lib/utils";

// Pillar icon mapping
const PILLAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  governance: Crown,
  hazard: Shield,
  vigilance: Eye,
  restoration: Heart,
};

const PILLAR_COLORS: Record<string, { text: string; bg: string; border: string; gradient: string }> = {
  governance: {
    text: "text-purple-400",
    bg: "bg-purple-500/20",
    border: "border-purple-500/40",
    gradient: "from-purple-500/10 to-indigo-500/10",
  },
  hazard: {
    text: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  vigilance: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/40",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  restoration: {
    text: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/40",
    gradient: "from-amber-500/10 to-orange-500/10",
  },
};

interface Question {
  question_id: string;
  question_title: string;
  question_text: string;
  pillar: string;
  status: string;  // pending, completed, generating, failed
  generated_at: string | null;
}

interface PillarDetailProps {
  pillarId: string;
  pillarName: string;
  pillarDescription: string;
  questions: Question[];
  isLoading: boolean;
  onBack: () => void;
  onSelectQuestion: (questionId: string) => void;
}

export function PillarDetail({
  pillarId,
  pillarName,
  pillarDescription,
  questions,
  isLoading,
  onBack,
  onSelectQuestion,
}: PillarDetailProps) {
  const Icon = PILLAR_ICONS[pillarId] || Crown;
  const colors = PILLAR_COLORS[pillarId] || PILLAR_COLORS.governance;
  
  const completedCount = questions.filter((q) => q.status === "completed").length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all"
            whileHover={{ scale: 1.02, x: -3 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </motion.button>
        </div>
        
        <div className="flex items-center gap-6">
          <motion.div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center border",
              colors.bg,
              colors.border
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className={cn("w-8 h-8", colors.text)} />
          </motion.div>
          
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{pillarName}</h1>
            <p className="text-slate-400">{pillarDescription}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                completedCount === 4 
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/50 text-slate-400"
              )}>
                {completedCount}/4 questions ready
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Questions Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <motion.button
              key={question.question_id}
              onClick={() => onSelectQuestion(question.question_id)}
              className={cn(
                "w-full text-left p-6 rounded-2xl border backdrop-blur-sm transition-all group",
                "bg-gradient-to-br from-slate-800/60 to-slate-900/60",
                question.status === "completed"
                  ? "border-emerald-500/30 hover:border-emerald-500/50"
                  : "border-slate-700/50 hover:border-slate-600/60"
              )}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01, x: 8 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Question number */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                      colors.bg,
                      colors.text
                    )}>
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-white group-hover:text-white/90">
                      {question.question_title}
                    </h3>
                  </div>
                  
                  {/* Question text */}
                  <p className="text-sm text-slate-400 ml-11 line-clamp-2">
                    {question.question_text}
                  </p>
                </div>
                
                {/* Status & Arrow */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {question.status === "completed" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Ready</span>
                    </motion.div>
                  ) : question.status === "generating" ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full">
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-xs font-medium text-amber-400">In Progress</span>
                    </div>
                  ) : question.status === "failed" ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-medium text-red-400">Failed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600/30 rounded-full">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-400">Pending</span>
                    </div>
                  )}
                  
                  <motion.div
                    className={cn("p-2 rounded-lg", colors.bg)}
                    whileHover={{ x: 4 }}
                  >
                    <ChevronRight className={cn("w-5 h-5", colors.text)} />
                  </motion.div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PillarDetail;
