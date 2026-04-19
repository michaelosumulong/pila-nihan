import { createClient } from "@supabase/supabase-js";

// Public credentials — anon keys are safe to expose client-side (RLS enforces security).
const SUPABASE_URL = "https://zrefejyyczkmcwldnzxq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZWZlanl5Y3prbWN3bGRuenhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTg2OTgsImV4cCI6MjA4ODE5NDY5OH0.yf6smrwlggVm7gHkzftIPEMpTr6glWq-Mv64gWYGGV8";

export interface SupabaseTicketRow {
  id: string;
  merchant_id: string | null;
  ticket_number: string;
  customer_name: string;
  customer_phone: string | null;
  service_pace: string | null;
  priority_paid: boolean | null;
  priority_amount: number | null;
  status: string | null;
  created_at: string;
  called_at: string | null;
  served_at: string | null;
  cancelled_at: string | null;
}

export interface SupabaseMerchantRow {
  id: string;
  business_name: string;
  owner_name: string | null;
  email: string | null;
  shop_code: string;
  business_category: string | null;
  service_plan: string | null;
  created_at: string;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 5 } },
});
