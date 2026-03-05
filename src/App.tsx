import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import QueueControls from "./pages/QueueControls";
import Analytics from "./pages/Analytics";
import GuestTicket from "./pages/GuestTicket";
import GuestEntry from "./pages/GuestEntry";
import Login from "./pages/Login";
import MerchantSignup from "./components/MerchantSignup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/queue" element={<QueueControls />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ticket/:ticketNumber" element={<GuestTicket />} />
          <Route path="/join/:merchantId" element={<GuestEntry />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<MerchantSignup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
