import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: "🎫",
    title: "Ticket Recovery",
    description: "Your spot in line is automatically saved in your browser, even if your phone restarts. Never lose your place due to technical issues.",
    color: "border-blue-500",
  },
  {
    icon: "📍",
    title: "Location Security",
    description: "Smart geofencing ensures only customers near the shop can join, preventing remote \"line-camping.\" Bypass codes available for GPS issues.",
    color: "border-green-500",
  },
  {
    icon: "🔔",
    title: "Real-Time Alerts",
    description: "Web Push notifications keep you updated so you can return exactly when you are called. Wait anywhere—grab coffee, shop nearby, stay productive.",
    color: "border-yellow-500",
  },
  {
    icon: "🔋",
    title: "Battery Optimized",
    description: "Built to run efficiently on mobile devices during long waits. Low Battery Mode reduces power consumption by 40-60% without sacrificing core functionality.",
    color: "border-purple-500",
  },
  {
    icon: "📊",
    title: "Business Analytics",
    description: "Real-time operational metrics, automated quality audits, and actionable insights for continuous improvement. Track efficiency, identify bottlenecks, optimize workflow.",
    color: "border-red-500",
  },
  {
    icon: "🤝",
    title: "Social Priority",
    description: "FREE priority queue for seniors, PWDs, and pregnant customers. Automatic 1:2 fairness ratio prevents line-cutting while serving those who need it most.",
    color: "border-pink-500",
  },
];

const valueProps = [
  {
    icon: "⚡",
    title: "Efficiency",
    description: "Reduces operational waste through precise wait-time measurement and automated quality audits. Track handling times, detect bottlenecks, and optimize staff allocation.",
    bg: "from-blue-50 to-blue-100",
  },
  {
    icon: "📱",
    title: "Accessibility",
    description: "A \"Filipino-Tough\" Progressive Web App (PWA) that works on any device without an app store download. No installation barriers, works offline, optimized for low-data connections.",
    bg: "from-green-50 to-green-100",
  },
  {
    icon: "🎯",
    title: "Flexibility",
    description: "Optimized for service-oriented businesses like barbershops, clinics, payment centers, and government offices. Adapts to your workflow, not the other way around.",
    bg: "from-yellow-50 to-yellow-100",
  },
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(220,100%,13%)] to-secondary py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="text-7xl mb-6" style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.5))" }}>🎫</div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Pila-nihan™</h1>
          <p className="text-3xl text-primary italic font-light mb-6">Ginhawa sa Bawat Pila</p>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            A professional queue management system designed to optimize business
            operations and improve the customer experience.
          </p>
        </div>
      </section>

      {/* Core Value Propositions */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Core Value Propositions</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {valueProps.map((v) => (
              <div key={v.title} className={`bg-gradient-to-br ${v.bg} rounded-xl p-6 shadow-lg`}>
                <div className="text-5xl mb-4 text-center">{v.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-3 text-center">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className={`bg-card rounded-xl p-6 shadow-md border-l-4 ${f.color}`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{f.icon}</div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[hsl(220,100%,13%)] to-secondary">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Queue?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join businesses already saving time and improving customer satisfaction.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:brightness-90 transition-all shadow-2xl"
          >
            Start Free Beta Trial
          </button>
          <p className="text-white/70 text-sm mt-4">
            No credit card required • First 10 beta testers get 2 months free
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(220,100%,13%)] text-white py-6">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-white/70 mb-2">© 2026 Pila-nihan™ • Ginhawa sa Bawat Pila</p>
          <p className="text-xs text-white/50">Version 1.0 Beta • Hand-crafted in the Philippines 🇵🇭</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/50 mt-3">
            <button onClick={() => navigate("/terms")} className="hover:text-white underline">Terms &amp; Conditions</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-white underline">Privacy Policy</button>
            <button onClick={() => navigate("/signup")} className="hover:text-white underline">Sign Up (Beta)</button>
            <a href="mailto:hello@pilanihan.ph" className="hover:text-white underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
