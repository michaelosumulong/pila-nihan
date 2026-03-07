import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PLACEHOLDERS = [
  "Why is the wait time increasing?",
  "Why is there only one counter open?",
  "Why wasn't the second staff assigned?",
  "Why is there no peak-hour staffing schedule?",
  "Why hasn't management reviewed queue analytics?",
];

interface FiveWhysModalProps {
  open: boolean;
  onClose: () => void;
  initialIssue?: string;
}

const FiveWhysModal = ({ open, onClose, initialIssue = "" }: FiveWhysModalProps) => {
  const [issue, setIssue] = useState(initialIssue);

  useEffect(() => {
    if (initialIssue) setIssue(initialIssue);
  }, [initialIssue]);
  const [whys, setWhys] = useState(["", "", "", "", ""]);

  const filledCount = whys.filter((w) => w.trim().length > 0).length;
  const isComplete = issue.trim().length > 0 && filledCount >= 5;

  const updateWhy = (idx: number, val: string) => {
    setWhys((prev) => prev.map((w, i) => (i === idx ? val : w)));
  };

  const save = () => {
    if (!isComplete) {
      toast.error("Please fill in the issue and all 5 Whys");
      return;
    }

    const analyses = JSON.parse(localStorage.getItem("root_cause_analyses") || "[]");
    analyses.push({
      issue,
      whys,
      rootCause: whys[4],
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("root_cause_analyses", JSON.stringify(analyses));

    toast.success("Root Cause Analysis saved!", {
      description: `Root cause: "${whys[4]}"`,
      duration: 6000,
    });

    setIssue("");
    setWhys(["", "", "", "", ""]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-white text-gray-900 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1E3A8A] flex items-center gap-2">
            🧐 5 Whys Root Cause Analysis
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Lean Six Sigma technique to find the true root cause of queue issues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Issue */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Issue / Problem Statement
            </label>
            <input
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g., Wait times exceeded 20 minutes on Tuesday"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* 5 Whys */}
          {whys.map((w, i) => (
            <div key={i}>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Why #{i + 1}
                {i === 4 && w.trim() && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">
                    ROOT CAUSE
                  </span>
                )}
              </label>
              <input
                value={w}
                onChange={(e) => updateWhy(i, e.target.value)}
                placeholder={PLACEHOLDERS[i]}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] ${
                  i === 4 && w.trim()
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300"
                }`}
              />
            </div>
          ))}

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all"
                style={{ width: `${(filledCount / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-semibold">{filledCount}/5</span>
          </div>

          {/* Root cause highlight */}
          {isComplete && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <p className="text-sm font-bold text-green-800 mb-1">🎯 Root Cause Identified:</p>
              <p className="text-sm text-green-700 italic">"{whys[4]}"</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!isComplete}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                isComplete
                  ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              💾 Save Analysis
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FiveWhysModal;
