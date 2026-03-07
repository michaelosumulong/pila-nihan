import { toast } from "sonner";

interface CustomerFeedbackModalProps {
  ticketNumber: string;
  customerName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const CustomerFeedbackModal = ({
  ticketNumber,
  customerName,
  onClose,
  onSubmitted,
}: CustomerFeedbackModalProps) => {
  const submitFeedback = (rating: "positive" | "negative") => {
    const feedback = {
      ticket: ticketNumber,
      customer: customerName,
      rating,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
    };

    const existing = JSON.parse(localStorage.getItem("customer_feedback") || "[]");
    existing.push(feedback);
    localStorage.setItem("customer_feedback", JSON.stringify(existing));

    // Clear active ticket since customer has been served
    localStorage.removeItem("pila-active-ticket");

    onSubmitted();
    toast.success("Thank you for your feedback!", {
      description: "Your input helps us improve!",
      duration: 3000,
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] z-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6 animate-bounce">✅</div>

        <h2 className="text-4xl font-bold text-white mb-3">Salamat po!</h2>

        <p className="text-xl text-white/90 mb-8">
          You've been served • Ticket {ticketNumber}
        </p>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/30 mb-6">
          <p className="text-white font-semibold mb-6">
            Kumusta ang inyong experience?
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => submitFeedback("positive")}
              className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-2xl"
            >
              <div className="text-5xl mb-3">😊</div>
              <div className="font-bold text-lg">Mabilis</div>
              <div className="text-sm opacity-90">Maayos ang pila</div>
            </button>

            <button
              onClick={() => submitFeedback("negative")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-2xl"
            >
              <div className="text-5xl mb-3">😐</div>
              <div className="font-bold text-lg">Mabagal</div>
              <div className="text-sm opacity-90">May issue</div>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-sm underline"
        >
          Skip feedback
        </button>
      </div>
    </div>
  );
};

export default CustomerFeedbackModal;
