import { useState } from "react";
import { toast } from "sonner";
import { printTicket } from "@/lib/print-ticket";
import { addTicketToQueue, loadQueue } from "@/utils/queueEngine";

interface WalkInModalProps {
  open: boolean;
  onClose: () => void;
  onTicketCreated: (ticket: any) => void;
}

const WalkInModal = ({ open, onClose, onTicketCreated }: WalkInModalProps) => {
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState<"regular" | "priority">("regular");

  if (!open) return null;

  const handleClose = () => {
    setManualName("");
    setManualCategory("regular");
    onClose();
  };

  const handleManualEntry = async () => {
    const trimmedName = manualName.trim();
    if (!trimmedName) {
      toast.error("Please enter customer name");
      return;
    }

    try {
      const merchant = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
      if (!merchant.id || !/^[0-9a-f-]{36}$/i.test(merchant.id)) {
        toast.error("No merchant session found. Please log in again.");
        return;
      }

      const queue = loadQueue();
      const prefix = manualCategory === "priority" ? "P" : "R";
      const sameTypeTickets = queue.tickets.filter((t) => t.ticketNumber?.startsWith(prefix));
      const nextNumber = String(sameTypeTickets.length + 1).padStart(3, "0");
      const ticketNumber = `${prefix}-${nextNumber}`;

      console.log("🚶 Creating walk-in ticket:", ticketNumber);

      const newTicket = await addTicketToQueue({
        ticketNumber,
        customerName: trimmedName,
        customerPhone: "",
        servicePace: manualCategory === "priority" ? "priority" : "regular",
        priorityPaid: false,
        priorityAmount: 0,
        merchantId: merchant.id,
        status: "waiting",
      });

      const position = queue.tickets.filter((t) => t.status === "waiting" || !t.status).length + 1;

      console.log("✅ Walk-in ticket created:", ticketNumber);
      toast.success(`✓ Ticket ${ticketNumber} created for ${trimmedName}`, {
        description: `Position: ${position} • Est. wait: ${position * 8} min`,
        duration: 8000,
        action: {
          label: "🖨️ Print",
          onClick: () => printTicket({ ...newTicket, mobile: "Walk-in (No phone)", category: manualCategory }),
        },
      });

      onTicketCreated(newTicket);
      handleClose();
    } catch (err: any) {
      console.error("❌ Walk-in creation failed:", err);
      toast.error("Failed to create walk-in ticket: " + (err?.message || "Unknown error"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-md z-10 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">➕ Add Walk-in Customer</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
          <p className="text-xs text-blue-700">💡 For customers without smartphones or those physically present</p>
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name *</label>
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Juan Dela Cruz"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
            autoFocus
          />
        </div>

        {/* Category Selection */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setManualCategory("regular")}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                manualCategory === "regular"
                  ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <p className="text-2xl">👥</p>
              <p className="font-bold text-gray-800 text-sm">Regular</p>
              <p className="text-xs text-gray-500">Standard queue</p>
            </button>
            <button
              type="button"
              onClick={() => setManualCategory("priority")}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                manualCategory === "priority"
                  ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <p className="text-2xl">🤝</p>
              <p className="font-bold text-gray-800 text-sm">Priority</p>
              <p className="text-xs text-gray-500">Senior/PWD/Buntis</p>
            </button>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleManualEntry}
          disabled={!manualName.trim()}
          className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
            manualName.trim()
              ? "bg-[#FFD700] text-[#1E3A8A] hover:bg-[#F59E0B] active:scale-95"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Add to Queue
        </button>

        {/* Paper Ticket Reminder */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mt-3">
          <p className="text-xs text-yellow-800">💡 Important: Write the ticket number on paper for the customer</p>
        </div>
      </div>
    </div>
  );
};

export default WalkInModal;
