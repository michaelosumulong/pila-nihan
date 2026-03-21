export const AntiCorruptionBadge = () => (
  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
    <span className="text-2xl flex-shrink-0">🛡️</span>
    <div>
      <p className="font-bold text-red-800 text-sm">Zero-Cash Policy</p>
      <p className="text-xs text-red-600 mt-0.5">
        All transactions are digital via GCash/Maya. No fixers, no under-the-table dealings.
      </p>
    </div>
  </div>
);

export const SuriValueBadge = ({ plan }: { plan: string }) => {
  if (plan !== "PANDAY") return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">🎁</span>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-green-800 text-sm">Beta Access Active</p>
          <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
            ₱999/mo FREE
          </span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          You're getting SINAG features at no cost during the beta period.
        </p>
      </div>
    </div>
  );
};
