import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const validateMobile = (value: string) => {
  const cleaned = value.replace(/\s+/g, "");
  return /^(\+639|09)\d{9}$/.test(cleaned);
};

const GuestEntry = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const buntingCount = 24;

  const merchantData = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
  const merchantName = merchantData.businessName || "Pila-nihan Queue System";

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"regular" | "priority">("regular");
  const [priorityConfirmed, setPriorityConfirmed] = useState(false);

  const isValid =
    name.trim() !== "" &&
    validateMobile(mobile) &&
    (selectedCategory === "regular" || priorityConfirmed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    try {
      const existingTickets = JSON.parse(localStorage.getItem("tickets") || "[]");
      const prefix = selectedCategory === "priority" ? "P" : "R";
      const sameTypeTickets = existingTickets.filter((t: any) => t.ticketNumber?.startsWith(prefix));
      const nextNumber = String(sameTypeTickets.length + 1).padStart(3, "0");
      const ticketNumber = `${prefix}-${nextNumber}`;
      const waitingTickets = existingTickets.filter((t: any) => t.status === "waiting");

      const newTicket = {
        id: `ticket-${Date.now()}`,
        merchant_id: merchantData.id || merchantId || "default",
        ticketNumber,
        customerName: name.trim(),
        mobile: mobile.trim(),
        category: selectedCategory,
        status: "waiting",
        joined_at: new Date().toISOString(),
        called_at: null,
        serving_started_at: null,
        completed_at: null,
        wait_time_minutes: null,
        handling_time_minutes: null,
        is_social_priority: selectedCategory === "priority",
        priority_reason: selectedCategory === "priority" ? "senior_pwd_pregnant" : null,
        paid_amount: 0.0,
        position: waitingTickets.length + 1,
        totalInQueue: waitingTickets.length + 1,
        estimatedWaitMinutes: (waitingTickets.length + 1) * 8,
        nowServing: existingTickets.find((t: any) => t.status === "serving")?.ticketNumber || "N/A",
      };

      existingTickets.push(newTicket);
      localStorage.setItem("tickets", JSON.stringify(existingTickets));

      toast.success(`Ticket ${ticketNumber} created!`, {
        description: `Welcome, ${name.trim()}!`,
      });

      navigate(`/ticket/${ticketNumber}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002366] via-[#1E5AA8] to-[#3B82F6] px-6 py-4 pb-12">
      {/* Bunting */}
      <div className="bunting pt-2 pb-1">
        {Array.from({ length: buntingCount }).map((_, i) => (
          <div key={i} className="bunting-triangle" />
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mt-4 mb-6">
        <div
          className="w-24 h-24 bg-[#3B82F6] rounded-2xl flex items-center justify-center mb-2"
          style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.5))" }}
        >
          <span className="text-6xl">🎫</span>
        </div>
        <h1 className="text-xl font-bold text-white text-center">Welcome to {merchantName}!</h1>
        <p className="text-[#FFD700] italic text-lg">Ginhawa sa Bawat Pila</p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto mb-6">
        <h2 className="text-2xl font-bold text-[#1E3A8A] text-center mb-6">Kumuha ng Ticket</h2>

        {/* Name */}
        <div className="mb-4">
          <Label htmlFor="name" className="text-gray-700 font-semibold mb-1 block">
            Pangalan <span className="text-gray-500 font-normal">(Complete Name)</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Juan Dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="py-3 px-4 rounded-lg border-2 h-auto text-base"
            required
          />
        </div>

        {/* Mobile */}
        <div className="mb-6">
          <Label htmlFor="mobile" className="text-gray-700 font-semibold mb-1 block">
            Mobile Number
          </Label>
          <Input
            id="mobile"
            type="tel"
            placeholder="+63 917 123 4567"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className={`py-3 px-4 rounded-lg border-2 h-auto text-base ${
              mobile && !validateMobile(mobile) ? "border-red-400" : ""
            }`}
            required
          />
          {mobile && !validateMobile(mobile) && (
            <p className="text-xs text-red-500 mt-1">Must start with +63 or 09 (11 digits)</p>
          )}
        </div>

        {/* Category Selection */}
        <div className="mb-4">
          <Label className="text-gray-700 font-semibold mb-2 block">Category</Label>
          <div className="grid grid-cols-2 gap-4">
            {/* Regular */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("regular");
                setPriorityConfirmed(false);
              }}
              className={`rounded-2xl border-2 p-4 text-center transition-all ${
                selectedCategory === "regular"
                  ? "border-[#3B82F6] bg-blue-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <span className="text-3xl block">👥</span>
              <p className="font-bold mt-1">Regular</p>
              <p className="text-sm text-gray-600">Standard queue</p>
            </button>

            {/* Priority */}
            <button
              type="button"
              onClick={() => setSelectedCategory("priority")}
              className={`rounded-2xl border-2 p-4 text-center transition-all ${
                selectedCategory === "priority"
                  ? "border-[#10B981] bg-green-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <span className="text-3xl block">🤝</span>
              <p className="font-bold mt-1">Priority</p>
              <span className="inline-block bg-[#10B981] text-white text-xs px-2 py-0.5 rounded mb-1">
                LIBRE
              </span>
              <p className="text-sm text-gray-600">Senior / PWD / Buntis</p>
            </button>
          </div>
        </div>

        {/* Priority Verification */}
        {selectedCategory === "priority" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <Checkbox
                id="priority-confirm"
                checked={priorityConfirmed}
                onCheckedChange={(checked) => setPriorityConfirmed(checked === true)}
              />
              <label htmlFor="priority-confirm" className="text-sm text-gray-700 cursor-pointer leading-tight">
                Ako ay Senior Citizen, PWD, o buntis at may dalang valid ID
              </label>
            </div>
            <p className="text-xs text-green-700 italic mt-2">
              Libreng serbisyo para sa ating mga nakatatanda at may kapansanan.
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-4 rounded-xl font-bold uppercase text-white text-lg shadow-lg transition-colors bg-[#FFD700] hover:bg-[#F59E0B] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Kumuha ng Ticket
        </button>

        {/* Anti-fraud note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          ⚠️ Priority tickets require valid ID verification at counter. Abuse of social priority may result in ticket cancellation.
        </p>
      </form>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full" />
        <span className="text-xs text-gray-300">Powered by Pila-nihan™</span>
      </div>
    </div>
  );
};

export default GuestEntry;
