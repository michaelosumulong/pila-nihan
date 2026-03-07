import { useNavigate } from "react-router-dom";

const techCards = [
  {
    icon: "📱",
    title: "Progressive Web App (PWA)",
    items: [
      "No app store download required",
      "Saves phone storage space (< 5MB total)",
      "Lightning-fast loading (< 2 seconds)",
      "Works on iPhone, Android, tablets, laptops",
      "Offline capability built-in",
      "Real-time alerts via Web Push (No SMS costs)",
      "Battery-efficient design for older devices",
    ],
  },
  {
    icon: "📊",
    title: "Lean Six Sigma Analytics",
    items: [
      "Real-time queue metrics (wait time, throughput)",
      "AI-powered business insights (SURI tier)",
      "Peak hours analysis & capacity planning",
      "No-show tracking & revenue recovery recommendations",
      "Performance benchmarking (Sigma Level scoring)",
      "Muda (Waste) identification & elimination",
    ],
  },
  {
    icon: "🔒",
    title: "Data Privacy & Security",
    items: [
      "Compliant with PH Data Privacy Act (RA 10173)",
      "Encrypted data transmission (HTTPS/TLS)",
      "Merchant owns their data (exportable anytime)",
      "No selling of customer information (ever)",
      "Transparent data usage (see our Privacy Policy)",
      "Anti-corruption audit trail (all actions logged)",
    ],
  },
  {
    icon: "🇵🇭",
    title: "Built for Philippines",
    items: [
      "Optimized for 3G/4G connections (works at 2G speeds)",
      "Works in areas with poor GPS (bypass code system)",
      "Supports non-smartphone users (manual entry)",
      "Filipino values embedded in code (paggalang, hustisya)",
      "Local payment integration (GCash/Maya) — coming soon",
      "Digital-only payments (eliminates \"fixers\")",
    ],
  },
];

const stats = [
  { value: "8 min", label: "Avg Wait Saved" },
  { value: "1:2", label: "Express-to-Regular Ratio" },
  { value: "₱0", label: "Social Priority Cost" },
  { value: "100%", label: "Digital Transactions" },
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-background via-secondary to-accent px-4 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23FFD700' fill-opacity='0.4'/%3E%3C/svg%3E\")", backgroundSize: "60px 60px" }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="text-7xl mb-4" style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.5))" }}>🎫</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Ginhawa sa Bawat Pila</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Fair, offline-ready queue management designed for the real Philippines — where lolas matter, internet drops, and every pila deserves dignity.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-y border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s) => (
            <div key={s.label} className="py-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="max-w-4xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8">
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-destructive mb-4">😤 The Problem</h2>
          <ul className="space-y-3 text-sm text-foreground/80">
            {["Seniors standing for hours in the sun", "\"Fixers\" selling queue spots for cash", "Paper-based systems that lose track of customers", "No visibility into wait times", "Business owners overwhelmed by crowd management"].map((t) => (
              <li key={t} className="flex items-start gap-2"><span className="text-destructive">✕</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-primary mb-4">✨ Our Solution</h2>
          <ul className="space-y-3 text-sm text-foreground/80">
            {["Social Priority: Seniors/PWD/Pregnant always first, always FREE", "Digital-only payments eliminate corruption", "Works offline — no internet needed to manage queue", "Walk-in support for customers without smartphones", "Real-time analytics powered by Lean Six Sigma"].map((t) => (
              <li key={t} className="flex items-start gap-2"><span className="text-primary">✓</span>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-card px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">🏛️ Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            To bring <span className="text-primary font-semibold">ginhawa</span> (ease), <span className="text-primary font-semibold">hustisya</span> (fairness), and <span className="text-primary font-semibold">dignidad</span> (dignity) to every queue in the Philippines — starting with the communities that need it most.
          </p>
        </div>
      </section>

      {/* Technical Details */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">🔧 The "Suri" Technical Edge</h2>
        <p className="text-center text-muted-foreground mb-10 text-sm">Enterprise-grade technology, barangay-level accessibility</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {techCards.map((card) => (
            <div key={card.title} className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="text-2xl">{card.icon}</span>{card.title}
              </h3>
              <ul className="space-y-2">
                {card.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-secondary to-background px-4 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Ready to Transform Your Business?</h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-8">
          Join the movement to bring <span className="italic">ginhawa</span>, <span className="italic">hustisya</span>, and <span className="italic">dignidad</span> to every pila in the Philippines.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <button onClick={() => navigate("/signup")} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-colors">
            🚀 Start Your Beta Trial (FREE)
          </button>
          <button onClick={() => navigate("/")} className="bg-accent/30 hover:bg-accent/50 text-foreground px-8 py-4 rounded-xl font-bold text-lg border-2 border-border transition-colors">
            📱 Try Demo
          </button>
        </div>

        {/* Founding Merchant */}
        <div className="max-w-lg mx-auto bg-card border border-primary/40 rounded-2xl p-6 text-left mb-8">
          <div className="text-sm font-bold text-primary mb-2">🏆 Founding Merchant Program</div>
          <p className="text-xs text-muted-foreground mb-3">Be one of our first 10 beta testers and get:</p>
          <ul className="space-y-1 text-xs text-foreground/80 mb-4">
            {["2 months completely FREE (₱0)", "\"Founding Merchant\" badge on your profile", "Direct support from the founder", "Your feedback shapes the product", "Lifetime 20% discount after beta", "First access to new features (GCash, analytics)"].map((t) => (
              <li key={t}>✓ {t}</li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            * Beta program terms apply. Express Lane pricing subject to 12% VAT (₱200 + ₱24 VAT for AGOS, ₱100 + ₱12 VAT for SULONG). Social Priority always FREE. Revenue split: 60% Platform / 40% Merchant.
            <button onClick={() => navigate("/terms")} className="underline hover:text-foreground ml-1">View complete Terms &amp; Conditions</button>
          </p>
        </div>

        {/* Anti-corruption */}
        <div className="max-w-lg mx-auto bg-primary/10 border border-primary/30 rounded-xl p-4 text-xs text-muted-foreground">
          🛡️ <strong>Anti-Corruption Commitment:</strong> Pila-nihan operates on digital-only payments to eliminate "fixers" and under-the-table transactions. All revenue is transparently tracked and 100% of Social Priority (Seniors/PWD/Pregnant) queue entries are FREE as mandated by Philippine law.
        </div>
      </section>

      {/* Founder's Note */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6 text-center">💌 A Personal Note from the Founder</h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>Growing up in the Philippines, I've stood in countless lines — at the LTO, at clinics, at the local bakery. I've seen lolas wait for hours, only to be cut in front of by someone with "connections." I've watched small business owners struggle to manage crowds with just a pen and paper.</p>
            <p><strong className="text-foreground">Pila-nihan exists because Filipinos deserve better.</strong> We deserve systems that work when the internet doesn't. We deserve technology that includes our lolo and lola, not just the tech-savvy. We deserve fairness, not favoritism.</p>
            <p>The <span className="text-primary font-bold">1:2 ratio</span> isn't just a feature — it's a mathematical expression of <em>paggalang</em> (respect). It means that for every Express customer who pays to skip ahead, two Regular customers are served first. It means Social Priority — our seniors, PWDs, and pregnant citizens — <em>always</em> go first, for free.</p>
            <p>This isn't just software — it's my small way of bringing <em>ginhawa</em> to our daily lives, one queue at a time.</p>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
            <p>Hand-crafted with ❤️ in the Philippines</p>
            <p className="font-semibold text-foreground">By MAS • Quezon City, Metro Manila 🇵🇭</p>
            <p>Powered by Lean Six Sigma principles &amp; Filipino values</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">© 2026 Pila-nihan™ • Ginhawa sa Bawat Pila</p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <button onClick={() => navigate("/about")} className="hover:text-foreground underline">About</button>
          <button onClick={() => navigate("/terms")} className="hover:text-foreground underline">Terms &amp; Conditions</button>
          <button onClick={() => navigate("/privacy")} className="hover:text-foreground underline">Privacy Policy</button>
          <button onClick={() => navigate("/signup")} className="hover:text-foreground underline">Sign Up (Beta)</button>
          <a href="mailto:hello@pilanihan.ph" className="hover:text-foreground underline">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default About;
