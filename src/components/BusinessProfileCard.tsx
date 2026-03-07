import { useState } from "react";
import { toast } from "sonner";

interface BusinessProfileCardProps {
  initialTarget?: number;
}

const BusinessProfileCard = ({ initialTarget }: BusinessProfileCardProps) => {
  const [targetHandlingTime, setTargetHandlingTime] = useState(() => {
    const merchant = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
    return merchant.targetHandlingTime || initialTarget || 8;
  });
  const [isEditing, setIsEditing] = useState(false);

  const save = () => {
    const clamped = Math.max(1, Math.min(120, targetHandlingTime));
    const merchant = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
    merchant.targetHandlingTime = clamped;
    localStorage.setItem("pila-merchant", JSON.stringify(merchant));
    setTargetHandlingTime(clamped);
    setIsEditing(false);
    toast.success("Target handling time updated!", {
      description: `Your benchmark is now ${clamped} minutes per customer`,
    });
  };

  const cancel = () => {
    const merchant = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
    setTargetHandlingTime(merchant.targetHandlingTime || 8);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#1E3A8A]">📊 Business Profile</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Target Handling Time (Takt Time)
        </label>

        {!isEditing ? (
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {targetHandlingTime} min
            </div>
            <p className="text-xs text-gray-600">
              Average time you aim to spend with each customer. This is your benchmark for analytics.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="number"
                value={targetHandlingTime}
                onChange={(e) => setTargetHandlingTime(parseInt(e.target.value) || 1)}
                min="1"
                max="120"
                className="w-24 px-4 py-2 text-2xl font-bold text-center rounded-lg border-2 border-blue-300 focus:border-blue-500 outline-none"
              />
              <span className="text-gray-700 font-medium">minutes</span>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded mb-3">
              <p className="text-xs text-yellow-800">
                💡 <strong>How to set this:</strong> Think about your average customer.
                How many minutes do they typically need? You can adjust this anytime.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={save}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700"
              >
                💾 Save
              </button>
              <button
                onClick={cancel}
                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessProfileCard;
