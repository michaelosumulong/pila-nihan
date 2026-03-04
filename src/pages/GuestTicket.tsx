import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  regular: { bg: "bg-gray-100", text: "text-gray-800", label: "Regular" },
  express: { bg: "bg-green-100", text: "text-green-800", label: "Express" },
  priority: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Priority" },
};

const getMessage = (position: number) => {
  if (position <= 0) return "Please proceed to the counter! 🎯";
  if (position === 1) return "You're next! 🎉";
  if (position === 2) return "Almost your turn! 😊";
  if (position <= 5) return "You're in the front section 👍";
  return "Thank you for waiting! ⏳";
};

const ordinal = (n: number) =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

const GuestTicket = () => {
  const { ticketNumber } = useParams();
  const buntingCount = 24;

  const [ticketData] = useState({
    ticketNumber: ticketNumber || "R-056",
    customerName: "Maria Santos",
    category: "regular",
    position: 2,
    totalInQueue: 10,
    estimatedWaitMinutes: 15,
    nowServing: "R-054",
  });

  const progressValue =
    ((ticketData.totalInQueue - ticketData.position) / ticketData.totalInQueue) * 100;

  const cat = CATEGORY_STYLES[ticketData.category] || CATEGORY_STYLES.regular;

  const handleUpgrade = (type: "express" | "priority") => {
    if (type === "express") {
      toast.success("Redirecting to payment: ₱100 Express Upgrade");
    } else {
      toast.success("Redirecting to payment: ₱200 Priority Upgrade");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Checking queue position...");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-6 py-4 pb-12">
      {/* Bunting */}
      <div className="bunting pt-2 pb-1">
        {Array.from({ length: buntingCount }).map((_, i) => (
          <div key={i} className="bunting-triangle" />
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mt-4 mb-6">
        <div className="w-32 h-32 bg-[#3B82F6] rounded-2xl flex items-center justify-center logo-glow mb-2">
          <span className="text-7xl">🎫</span>
        </div>
        <h1 className="text-2xl font-bold text-white">PILA-NIHAN™</h1>
        <p className="text-[#FFB703] italic text-lg">Ginhawa sa Bawat Pila</p>
      </div>

      {/* Ticket Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-4xl">🎫</span>
          <span className="text-8xl font-bold text-[#1E3A8A]">{ticketData.ticketNumber}</span>
        </div>
        <p className="text-2xl font-medium text-gray-700 mb-2">{ticketData.customerName}</p>
        <span className={`${cat.bg} ${cat.text} px-4 py-2 rounded-full text-lg font-semibold inline-block`}>
          {cat.label}
        </span>
      </div>

      {/* Position & Wait Time */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <p className="text-gray-600 text-sm uppercase mb-2">Your Position</p>
          <span className="text-2xl">👥</span>
          <p className="text-4xl font-bold text-[#3B82F6]">{ordinal(ticketData.position)} in line</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <p className="text-gray-600 text-sm uppercase mb-2">Estimated Wait</p>
          <p className="text-3xl font-bold text-[#FFB703]">⏱️ {ticketData.estimatedWaitMinutes} min</p>
          <p className="text-xs text-gray-500 mt-1">Based on average service time</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto mb-6 bg-white rounded-2xl shadow-lg p-5">
        <p className="text-sm text-gray-600 mb-2">Queue Progress</p>
        <Progress value={progressValue} className="h-4 bg-gray-200 [&>div]:bg-[#10B981]" />
        <p className="text-xs text-gray-500 mt-2">
          {ticketData.position} of {ticketData.totalInQueue} in queue
        </p>
      </div>

      {/* Now Serving */}
      <div className="max-w-md mx-auto mb-6 bg-white rounded-2xl shadow-lg p-5 text-center">
        <p className="text-sm text-gray-600 uppercase mb-1">Now Serving:</p>
        <p className="text-2xl font-bold text-[#1E3A8A]">{ticketData.nowServing}</p>
        <p className="text-lg mt-2">{getMessage(ticketData.position)}</p>
      </div>

      {/* Upgrade Options */}
      <div className="max-w-md mx-auto mb-6">
        <h3 className="text-white font-bold text-lg mb-3 text-center">Upgrade Your Spot</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Express */}
          <div className="bg-white rounded-2xl border-2 border-[#10B981] p-4 text-center">
            <span className="text-3xl">⚡</span>
            <p className="font-bold text-lg mt-1">Express</p>
            <p className="text-2xl font-bold text-[#10B981]">₱100</p>
            <ul className="text-xs text-gray-600 my-2 space-y-1">
              <li>Skip ahead in line</li>
              <li>Served within 10 min</li>
            </ul>
            <button
              onClick={() => handleUpgrade("express")}
              className="bg-[#10B981] text-white w-full py-2 rounded-lg font-bold active:scale-95 transition-transform"
            >
              Upgrade
            </button>
          </div>
          {/* Priority */}
          <div className="bg-white rounded-2xl border-2 border-[#FFB703] p-4 text-center">
            <span className="text-3xl">⭐</span>
            <p className="font-bold text-lg mt-1">Priority</p>
            <p className="text-2xl font-bold text-[#FFB703]">₱200</p>
            <ul className="text-xs text-gray-600 my-2 space-y-1">
              <li>Jump to front</li>
              <li>Served within 5 min</li>
            </ul>
            <button
              onClick={() => handleUpgrade("priority")}
              className="bg-[#FFB703] text-white w-full py-2 rounded-lg font-bold active:scale-95 transition-transform"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Report Issue */}
      <div className="max-w-md mx-auto text-center mb-4">
        <button
          onClick={() => toast.info("Contact support: +63 917 PILA-HELP")}
          className="text-sm text-gray-300 underline"
        >
          ⚠️ Report an Issue
        </button>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs text-gray-300">Updates automatically</span>
      </div>
    </div>
  );
};

export default GuestTicket;
