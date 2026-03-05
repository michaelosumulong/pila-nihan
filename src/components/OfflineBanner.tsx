interface OfflineBannerProps {
  isOnline: boolean;
}

const OfflineBanner = ({ isOnline }: OfflineBannerProps) => {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-center py-2 text-sm font-semibold z-[60]">
      📶 Working Offline - Changes will sync when connection returns
    </div>
  );
};

export default OfflineBanner;
