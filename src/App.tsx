import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandingProvider } from "@/contexts/BrandingContext";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Revenue from "./pages/Revenue";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import QueueControls from "./pages/QueueControls";
import Analytics from "./pages/Analytics";
import GuestTicket from "./pages/GuestTicket";
import GuestEntry from "./pages/GuestEntry";
import Login from "./pages/Login";
import MerchantSignup from "./components/MerchantSignup";
import About from "./pages/About";
import Guide from "./pages/Guide";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrandingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/ticket/:ticketNumber" element={<GuestTicket />} />
            <Route path="/join/:merchantId" element={<GuestEntry />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<MerchantSignup />} />
            <Route path="/about" element={<About />} />
            <Route path="/guide" element={<Guide />} />

            {/* Merchant routes with shared sidebar */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/queue" element={<QueueControls />} />
              <Route path="/revenue" element={<Revenue />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
