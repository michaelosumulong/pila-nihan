import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import VersionFooter from "@/components/VersionFooter";

const CustomerGuide = () => (
  <div className="space-y-8">
    {/* Quick Start */}
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-[hsl(220,100%,13%)] mb-4">⚡ Quick Start (30 seconds)</h2>
      <ol className="space-y-3">
        {[
          { step: "1", title: "Get the Shop Code", desc: "Look for a QR code or posted code at the shop entrance" },
          { step: "2", title: "Enter Your Info", desc: "Name and mobile number (for notifications)" },
          { step: "3", title: "Wait Anywhere", desc: "Go grab coffee, shop nearby, or relax in your car" },
          { step: "4", title: "Get Notified", desc: "Return when the bell icon alerts you it's your turn" },
        ].map((item) => (
          <li key={item.step} className="flex items-start gap-3">
            <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</span>
            <div>
              <p className="font-bold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-700">{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>

    {/* Detailed Steps */}
    <div className="bg-card rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 Step-by-Step Guide</h2>

      {/* Step 1 */}
      <div className="mb-8 pb-8 border-b border-border">
        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">1️⃣</span> Join the Queue
        </h3>
        <p className="text-gray-700 mb-4">
          Enter the shop code you see posted at the business. Example: <code className="bg-muted px-2 py-1 rounded font-mono font-bold">PILANIHAN</code>
        </p>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-sm text-yellow-800">
            💡 <strong>Pro Tip:</strong> You can scan the QR code instead of typing! Look for a poster at the shop entrance.
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="mb-8 pb-8 border-b border-border">
        <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="text-2xl">2️⃣</span> Location Check
        </h3>
        <p className="text-muted-foreground mb-4">The app will ask for your location to confirm you're near the shop (within 20km).</p>
        <div className="space-y-3">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm font-bold text-green-800 mb-1">✅ Location Works</p>
            <p className="text-sm text-green-700">You'll see: "You're within range!" and can proceed to enter your details.</p>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm font-bold text-yellow-800 mb-1">⚠️ Location Issues?</p>
            <p className="text-sm text-yellow-700 mb-2">
              If GPS doesn't work (thick walls, weak signal), ask the merchant for the <strong>6-digit Bypass Code</strong> displayed on their dashboard.
            </p>
            <p className="text-xs text-yellow-600">
              Example: <code className="bg-yellow-100 px-2 py-1 rounded font-mono font-bold">3FJFWU</code> (changes daily for security)
            </p>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="mb-8 pb-8 border-b border-border">
        <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
          <span className="text-2xl">3️⃣</span> Watch Your Position
        </h3>
        <p className="text-muted-foreground mb-4">Your ticket screen shows your position in real-time. No need to refresh - it updates automatically!</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-bold text-blue-900 mb-2">📊 What You'll See</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your ticket number (e.g., R-001)</li>
              <li>• Current position in line</li>
              <li>• Estimated wait time</li>
              <li>• Number of people ahead</li>
            </ul>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="font-bold text-purple-900 mb-2">🔔 Notifications</p>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• "You're moving up!"</li>
              <li>• "Almost your turn!" (top 3)</li>
              <li>• "YOUR TURN!" (called)</li>
            </ul>
          </div>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Pro Tip:</strong> Keep the notification bell icon in view. A red badge means you have new alerts!
          </p>
        </div>
      </div>

      {/* Step 4 */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">4️⃣</span> Your Turn!
        </h3>
        <p className="text-gray-700 mb-4">
          When you see your ticket turn <strong className="text-green-600">GREEN</strong> or receive a "YOUR TURN!" notification, head to the counter.
        </p>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-sm text-green-800">✅ Show your ticket number to the staff. They'll serve you immediately!</p>
        </div>
      </div>
    </div>

    {/* Install Guide */}
    <div className="bg-card rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 How to Install (Add to Home Screen)</h2>
      <p className="text-gray-700 mb-6">
        For the best experience, "install" Pila-nihan to your phone. It works like a native app - faster, offline-capable, and you'll never lose the link!
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl"></span>
            <h3 className="text-xl font-bold text-gray-900">iPhone (iOS)</h3>
          </div>
          <ol className="space-y-3 text-sm text-gray-700">
            {["Open Pila-nihan in **Safari** browser", "Tap the **Share** button (box with arrow up)", 'Scroll and tap **"Add to Home Screen"**', 'Tap **"Add"** in the top right', "Find the Pila-nihan icon on your home screen!"].map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-bold text-blue-600">{i + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              </li>
            ))}
          </ol>
        </div>
        <div className="border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🤖</span>
            <h3 className="text-xl font-bold text-gray-900">Android</h3>
          </div>
          <ol className="space-y-3 text-sm text-gray-700">
            {["Open Pila-nihan in **Chrome** browser", "Tap the **three dots (⋮)** menu in top right", 'Tap **"Add to Home screen"** or **"Install app"**', 'Tap **"Add"** or **"Install"**', "Find the Pila-nihan icon on your home screen!"].map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-bold text-green-600">{i + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-6">
        <p className="text-sm text-blue-800">
          💡 <strong>Why Install?</strong> Installed apps get priority for notifications, work offline, use less battery, and you'll never lose your spot in line!
        </p>
      </div>
    </div>

    {/* Troubleshooting */}
    <div className="bg-card rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Troubleshooting</h2>
      <div className="space-y-4">
        {[
          { q: "❓ I closed my browser tab and lost my ticket", a: 'Don\'t worry! Go back to the main page. If your ticket is still active, you\'ll see a yellow "Welcome back!" banner with a button to view your ticket.' },
          { q: "❓ Location not working / GPS error", a: 'Ask the merchant for the 6-digit <strong>Daily Bypass Code</strong> (displayed on their dashboard). Enter it in the "Having GPS trouble?" field.' },
          { q: "❓ Not getting notifications", a: "Check the 🔔 bell icon for in-app notifications. For browser notifications, you may need to allow permissions. Install the app to your home screen for better notification reliability." },
          { q: "❓ My position isn't updating", a: 'Tap the "🔄 Refresh" button on your ticket screen. If offline mode is active, make sure you have an internet connection and tap "Update Position."' },
          { q: "❓ I don't have a smartphone", a: 'No problem! Ask the merchant to add you manually using the "➕ Add Walk-in" button. They\'ll print a physical ticket for you.' },
        ].map((item, i) => (
          <details key={i} className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100">
            <summary className="font-bold text-gray-900">{item.q}</summary>
            <p className="text-sm text-gray-700 mt-3" dangerouslySetInnerHTML={{ __html: item.a }} />
          </details>
        ))}
      </div>
    </div>
  </div>
);

const MerchantGuide = () => (
  <div className="space-y-8">
    {/* Quick Start */}
    <div className="bg-purple-50 border-l-4 border-purple-500 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-[hsl(220,100%,13%)] mb-4">⚡ Quick Setup (5 minutes)</h2>
      <ol className="space-y-3">
        {[
          { step: "1", title: "Create Your Account", desc: "Business name, category, location, target handling time" },
          { step: "2", title: "Print Your Shop Code", desc: "Display QR code and shop code at entrance" },
          { step: "3", title: "Start Calling Customers", desc: 'Use "Call Next" button to notify customers' },
        ].map((item) => (
          <li key={item.step} className="flex items-start gap-3">
            <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</span>
            <div>
              <p className="font-bold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-700">{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>

    {/* Dashboard Guide */}
    <div className="bg-card rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🏪 Using Your Dashboard</h2>
      <div className="space-y-6">
        {[
          { color: "green", icon: "📢", title: "Call Next Customer", desc: 'Click the green "📢 Call Next" button to notify the next customer in line. They\'ll get an alert on their phone and the ticket will turn green.', tip: "Call the customer when you're 90% done with the current one to minimize gaps between customers." },
          { color: "blue", icon: "✅", title: "Mark as Served", desc: 'After completing service, click "✓ Mark Served". This triggers the customer satisfaction survey and updates your analytics.', tip: null },
          { color: "red", icon: "❌", title: "Mark as No-Show", desc: 'If a customer doesn\'t respond after being called, mark them as "No-Show". This removes them from the queue and tracks your no-show rate.', tip: null },
          { color: "yellow", icon: "➕", title: "Add Walk-in Customer", desc: 'For customers without smartphones, use "➕ Add Walk-in". Enter their name, choose Regular or Priority, and print a ticket.', tip: "This ensures everyone can use your queue, not just tech-savvy customers." },
        ].map((item) => (
          <div key={item.title} className={`border-l-4 border-${item.color}-500 pl-6`}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.icon} {item.title}</h3>
            <p className="text-gray-700 mb-3">{item.desc}</p>
            {item.tip && (
              <div className={`bg-${item.color}-50 p-3 rounded`}>
                <p className={`text-sm text-${item.color}-800`}>💡 <strong>Pro Tip:</strong> {item.tip}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Bypass Codes */}
    <div className="bg-card rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-[hsl(220,100%,13%)] mb-6">🔑 Daily Bypass Codes</h2>
      <p className="text-muted-foreground mb-4">
        Your dashboard displays a <strong>6-digit Bypass Code</strong> that changes daily. This code allows customers to join the queue even if GPS location fails.
      </p>
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300 mb-4">
        <p className="text-center mb-2 text-sm text-muted-foreground">Today's Bypass Code</p>
        <p className="text-center text-5xl font-mono font-bold text-[hsl(220,100%,13%)] tracking-widest">3FJFWU</p>
        <p className="text-center mt-2 text-xs text-muted-foreground">(Example - yours will be different)</p>
      </div>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800 mb-2"><strong>When to use:</strong></p>
        <ul className="text-sm text-blue-700 space-y-1 ml-4">
          <li>• Customer is in a building with thick walls (weak GPS)</li>
          <li>• Customer's phone has location services disabled</li>
          <li>• Customer is slightly outside the 20km radius</li>
        </ul>
      </div>
    </div>

    {/* Analytics */}
    <div className="bg-card rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-[hsl(220,100%,13%)] mb-6">📊 Business Analytics</h2>
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-5">
          <h3 className="font-bold text-foreground mb-2">⏱️ Takt Time (Target Handling Time)</h3>
          <p className="text-sm text-muted-foreground">
            This is your benchmark - the average time you <em>aim</em> to spend with each customer. Set it slightly higher than your actual speed to give realistic wait time estimates.
          </p>
          <div className="bg-blue-200 rounded p-3 mt-3">
            <p className="text-xs text-blue-900">
              💡 <strong>Example:</strong> If you typically serve customers in 7 minutes, set your target to 8-9 minutes to account for complex cases.
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-5">
          <h3 className="font-bold text-foreground mb-2">🔍 Automated Quality Audits</h3>
          <p className="text-sm text-muted-foreground">
            The system automatically flags when a customer takes 50% longer than your target, or when there's a 15+ minute gap between customers (idle time).
          </p>
          <p className="text-xs text-green-800 mt-2">These flags appear in your "Suri Backlog" for root cause analysis.</p>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-5">
          <h3 className="font-bold text-foreground mb-2">😊 Customer Satisfaction</h3>
          <p className="text-sm text-muted-foreground">
            After service, customers rate their experience (Fast/Good or Slow/Issue). Track your satisfaction percentage to measure service quality.
          </p>
        </div>
      </div>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-6">
        <p className="text-sm text-yellow-800">
          💡 <strong>Pro Tip:</strong> Check analytics daily to identify peak hours. Use this data to optimize staff schedules and reduce wait times.
        </p>
      </div>
    </div>

    {/* Best Practices */}
    <div className="bg-card rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-[hsl(220,100%,13%)] mb-6">⭐ Best Practices</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <p className="font-bold text-green-900 mb-2">✅ DO</p>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Display QR code prominently at entrance</li>
            <li>• Call customers before finishing with current one</li>
            <li>• Check Suri Backlog daily for improvement areas</li>
            <li>• Offer manual entry for non-smartphone users</li>
            <li>• Keep bypass code visible for GPS issues</li>
          </ul>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
          <p className="font-bold text-red-900 mb-2">❌ DON'T</p>
          <ul className="text-sm text-red-800 space-y-1">
            <li>• Don't let customers wait to be called twice</li>
            <li>• Don't ignore "No-Show" tickets (mark them!)</li>
            <li>• Don't set unrealistic target handling times</li>
            <li>• Don't forget to mark customers as "Served"</li>
            <li>• Don't hide the shop code/QR code</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const Guide = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"customer" | "merchant">("customer");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "merchant") setActiveTab("merchant");
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(220,100%,13%)] to-[hsl(217,91%,60%)] py-12">
        <div className="container mx-auto px-6 text-center">
          <button onClick={() => navigate(-1)} className="absolute left-4 top-4 text-white/80 hover:text-white text-sm">
            ← Back
          </button>
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">How It Works</h1>
          <p className="text-xl text-white/90">Your complete guide to using Pila-nihan</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="container mx-auto px-6 max-w-4xl -mt-8 relative z-10">
        <div className="bg-card rounded-2xl shadow-xl p-2 flex gap-2">
          <button
            onClick={() => setActiveTab("customer")}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
              activeTab === "customer"
                ? "bg-gradient-to-r from-[hsl(220,100%,13%)] to-[hsl(217,91%,60%)] text-white shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            👤 For Customers
          </button>
          <button
            onClick={() => setActiveTab("merchant")}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
              activeTab === "merchant"
                ? "bg-gradient-to-r from-[hsl(220,100%,13%)] to-[hsl(217,91%,60%)] text-white shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            🏪 For Merchants
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 max-w-4xl py-12">
        {activeTab === "customer" ? <CustomerGuide /> : <MerchantGuide />}
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-[hsl(220,100%,13%)] to-[hsl(217,91%,60%)] py-12">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to skip the line?</h3>
          <button
            onClick={() => navigate("/")}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:brightness-90 transition-all"
          >
            Join a Queue Now
          </button>
        </div>
      </div>

      <VersionFooter />
    </div>
  );
};

export default Guide;
