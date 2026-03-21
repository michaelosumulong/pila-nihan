import { useState } from "react";

const ROICalculator = () => {
  const [customers, setCustomers] = useState(50);
  const [avgWait, setAvgWait] = useState(15);
  const [avgSpend, setAvgSpend] = useState(200);

  const walkawayRate = Math.min(avgWait * 1.5, 40);
  const lostCustomers = Math.round(customers * (walkawayRate / 100));
  const dailyLoss = lostCustomers * avgSpend;
  const monthlyLoss = dailyLoss * 26;
  const savedWithPila = Math.round(monthlyLoss * 0.7);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🧮</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">ROI Calculator</h3>
          <p className="text-sm text-gray-600">See how much you could save</p>
        </div>
      </div>

      <div className="space-y-5 mb-6">
        <SliderInput
          label="Daily Customers"
          value={customers}
          onChange={setCustomers}
          min={10}
          max={200}
          unit=""
          icon="👥"
        />
        <SliderInput
          label="Avg. Wait Time (min)"
          value={avgWait}
          onChange={setAvgWait}
          min={5}
          max={60}
          unit="min"
          icon="⏱️"
        />
        <SliderInput
          label="Avg. Spend per Customer"
          value={avgSpend}
          onChange={setAvgSpend}
          min={50}
          max={2000}
          unit="₱"
          icon="💰"
        />
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-red-700 font-semibold mb-1">Without Pila-nihan:</p>
        <p className="text-xs text-red-600">
          ~{walkawayRate.toFixed(0)}% walk-away rate → {lostCustomers} lost customers/day
        </p>
        <p className="text-2xl font-bold text-red-600 mt-1">
          ₱{monthlyLoss.toLocaleString()}/mo lost
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm text-green-700 font-semibold mb-1">With Pila-nihan:</p>
        <p className="text-xs text-green-600">
          70% fewer walk-aways with queue management
        </p>
        <p className="text-2xl font-bold text-green-600 mt-1">
          ₱{savedWithPila.toLocaleString()}/mo saved
        </p>
        <p className="text-xs text-green-500 mt-1">
          ROI: {Math.round(savedWithPila / 999)}x return on SINAG plan
        </p>
      </div>
    </div>
  );
};

const SliderInput = ({
  label, value, onChange, min, max, unit, icon,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; unit: string; icon: string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-sm font-bold text-gray-900">
        {unit === "₱" ? `₱${value.toLocaleString()}` : `${value}${unit ? ` ${unit}` : ""}`}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
    />
  </div>
);

export default ROICalculator;
