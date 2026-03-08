import { useNavigate } from "react-router-dom";

const VersionFooter = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#1E3A8A] text-white py-6 mt-12">
      <div className="container mx-auto px-6 text-center">
        <div className="flex justify-center gap-4 mb-3">
          <button onClick={() => navigate("/about")} className="text-white/70 hover:text-white text-sm transition-colors">
            About
          </button>
          <span className="text-white/30">•</span>
          <button onClick={() => navigate("/guide")} className="text-white/70 hover:text-white text-sm transition-colors">
            How It Works
          </button>
        </div>
        <p className="text-sm text-white/70 mb-2">
          © 2026 Pila-nihan™ • Ginhawa sa Bawat Pila
        </p>
        <p className="text-xs text-white/50">
          Version 1.0 Beta • Hand-crafted with ❤️ in the Philippines 🇵🇭
        </p>
      </div>
    </div>
  );
};

export default VersionFooter;
