interface LowBatteryBannerProps {
  lastRefresh: Date;
  onRefresh: () => void;
}

const LowBatteryBanner = ({ lastRefresh, onRefresh }: LowBatteryBannerProps) => (
  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg mb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-yellow-700">🔋</span>
        <div>
          <p className="text-sm font-semibold text-yellow-800">Low Battery Mode Active</p>
          <p className="text-xs text-yellow-700">
            Last refreshed:{" "}
            {lastRefresh.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2"
      >
        🔄 Refresh Now
      </button>
    </div>
  </div>
);

export default LowBatteryBanner;
