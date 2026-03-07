interface LowBatteryToggleProps {
  active: boolean;
  onToggle: () => void;
}

const LowBatteryToggle = ({ active, onToggle }: LowBatteryToggleProps) => (
  <div className="border-t border-gray-200 pt-2 mt-2">
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
        active ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="text-xl">🔋</span>
      <div className="flex-1">
        <div className="font-medium">Low Battery Mode</div>
        <div className="text-xs opacity-70">
          {active ? "Active (60s refresh)" : "Inactive (5s refresh)"}
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full transition-colors ${active ? "bg-green-500" : "bg-gray-300"}`}>
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
            active ? "translate-x-6" : "translate-x-0.5"
          } mt-0.5`}
        />
      </div>
    </button>
  </div>
);

export default LowBatteryToggle;
