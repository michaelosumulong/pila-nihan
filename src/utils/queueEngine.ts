/**
 * Queue Engine: Supabase-backed with localStorage cache for sync access.
 *
 * Architecture:
 *  - Source of truth: Supabase `tickets` table.
 *  - localStorage `pila-queue` is a CACHE only (hydrated by fetchQueue + realtime).
 *  - Sync helpers (loadQueue/saveQueue) are kept for legacy callers and read/write the cache.
 *  - Async helpers (fetchQueue, addTicketToQueue, updateTicketStatus, subscribeToQueue) talk to Supabase.
 */

import { supabase, type SupabaseTicketRow } from "@/lib/supabase";

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone?: string;
  status: "waiting" | "called" | "serving" | "served" | "no_show" | "cancelled";
  servicePace?: "regular" | "express" | "priority" | "standard" | "technical";
  priorityPaid?: boolean;
  priorityAmount?: number;
  created_at: string;
  called_at?: string;
  served_at?: string;
  cancelledAt?: string;
  estimatedLoss?: number;
  merchantId?: string;
}

export interface Queue {
  tickets: Ticket[];
  lastTicketNumber: number;
  merchantId: string;
}

const CACHE_KEY = "pila-queue";

const EMPTY_QUEUE: Queue = { tickets: [], lastTicketNumber: 0, merchantId: "default" };

/* ────────────────────────────  Mappers  ──────────────────────────── */

const rowToTicket = (row: SupabaseTicketRow): Ticket => ({
  id: row.id,
  ticketNumber: row.ticket_number,
  customerName: row.customer_name,
  customerPhone: row.customer_phone || undefined,
  status: (row.status as Ticket["status"]) || "waiting",
  servicePace: (row.service_pace as Ticket["servicePace"]) || "regular",
  priorityPaid: row.priority_paid ?? undefined,
  priorityAmount: row.priority_amount ?? undefined,
  created_at: row.created_at,
  called_at: row.called_at || undefined,
  served_at: row.served_at || undefined,
  cancelledAt: row.cancelled_at || undefined,
  merchantId: row.merchant_id || undefined,
});

/* ────────────────────────────  Cache (localStorage)  ──────────────────────────── */

export const loadQueue = (): Queue => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return { ...EMPTY_QUEUE };
    const parsed = JSON.parse(stored);
    return {
      tickets: parsed.tickets || [],
      lastTicketNumber: parsed.lastTicketNumber || 0,
      merchantId: parsed.merchantId || "default",
    };
  } catch {
    return { ...EMPTY_QUEUE };
  }
};

export const saveQueue = (queue: Queue): void => {
  // Cache only. Cloud writes go through addTicketToQueue / updateTicketStatus.
  localStorage.setItem(CACHE_KEY, JSON.stringify(queue));
};

const replaceCache = (tickets: Ticket[], merchantId?: string): Queue => {
  const lastTicketNumber = tickets.reduce((max, t) => {
    const n = parseInt(t.ticketNumber.replace(/\D/g, ""), 10);
    return !isNaN(n) && n > max ? n : max;
  }, 0);
  const queue: Queue = {
    tickets,
    lastTicketNumber,
    merchantId: merchantId || loadQueue().merchantId || "default",
  };
  saveQueue(queue);
  return queue;
};

/* ────────────────────────────  Cloud (Supabase)  ──────────────────────────── */

/**
 * Fetch all tickets for the active merchant from Supabase and refresh the cache.
 * Pass merchantId to scope; omit to fetch all (useful in single-tenant demo).
 */
export const fetchQueue = async (merchantId?: string): Promise<Queue> => {
  let query = supabase.from("tickets").select("*").order("created_at", { ascending: true });
  if (merchantId) query = query.eq("merchant_id", merchantId);

  const { data, error } = await query;
  if (error) {
    console.error("❌ fetchQueue failed:", error.message);
    return loadQueue();
  }
  const tickets = (data as SupabaseTicketRow[]).map(rowToTicket);
  const queue = replaceCache(tickets, merchantId);
  console.log(`☁️  fetchQueue: ${tickets.length} tickets from Supabase`);
  return queue;
};

/**
 * Insert a new ticket. Caller provides ticketNumber (preserves R-/P- prefix logic).
 */
export const addTicketToQueue = async (
  ticket: Omit<Ticket, "id" | "created_at" | "status"> & { status?: Ticket["status"] }
): Promise<Ticket> => {
  const insertPayload = {
    merchant_id: ticket.merchantId || null,
    ticket_number: ticket.ticketNumber,
    customer_name: ticket.customerName,
    customer_phone: ticket.customerPhone || null,
    service_pace: ticket.servicePace || "regular",
    priority_paid: ticket.priorityPaid ?? false,
    priority_amount: ticket.priorityAmount ?? 0,
    status: ticket.status || "waiting",
  };

  const { data, error } = await supabase
    .from("tickets")
    .insert(insertPayload)
    .select()
    .single();

  if (error || !data) {
    console.error("❌ addTicketToQueue failed:", error?.message);
    throw new Error(error?.message || "Failed to create ticket");
  }

  const newTicket = rowToTicket(data as SupabaseTicketRow);

  // Update cache optimistically
  const queue = loadQueue();
  queue.tickets.push(newTicket);
  const n = parseInt(newTicket.ticketNumber.replace(/\D/g, ""), 10);
  if (!isNaN(n)) queue.lastTicketNumber = Math.max(queue.lastTicketNumber, n);
  saveQueue(queue);

  console.log("☁️  Ticket inserted:", newTicket.ticketNumber);
  return newTicket;
};

/**
 * Update a ticket's status (and optional timestamp fields) in Supabase + cache.
 */
export const updateTicketStatus = async (
  ticketId: string,
  status: Ticket["status"],
  additionalData?: Partial<Ticket>
): Promise<boolean> => {
  const update: Record<string, unknown> = { status };
  if (additionalData?.called_at !== undefined) update.called_at = additionalData.called_at;
  if (additionalData?.served_at !== undefined) update.served_at = additionalData.served_at;
  if (additionalData?.cancelledAt !== undefined) update.cancelled_at = additionalData.cancelledAt;
  if (additionalData?.servicePace !== undefined) update.service_pace = additionalData.servicePace;

  const { error } = await supabase.from("tickets").update(update).eq("id", ticketId);
  if (error) {
    console.error("❌ updateTicketStatus failed:", error.message);
    return false;
  }

  // Update cache
  const queue = loadQueue();
  const idx = queue.tickets.findIndex((t) => t.id === ticketId);
  if (idx !== -1) {
    queue.tickets[idx] = { ...queue.tickets[idx], status, ...additionalData };
    saveQueue(queue);
  }

  console.log("☁️  Ticket updated:", ticketId, "→", status);
  return true;
};

/**
 * Subscribe to realtime ticket changes. Returns an unsubscribe function.
 * Re-fetches the full queue on any change (simple + correct).
 */
export const subscribeToQueue = (
  merchantId: string | undefined,
  onChange: (queue: Queue) => void
): (() => void) => {
  const channel = supabase
    .channel(`tickets-${merchantId || "all"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tickets" },
      async () => {
        const fresh = await fetchQueue(merchantId);
        onChange(fresh);
      }
    )
    .subscribe();

  console.log("📡 Subscribed to realtime tickets");
  return () => {
    supabase.removeChannel(channel);
    console.log("📡 Unsubscribed from realtime tickets");
  };
};

/* ────────────────────────────  Helpers  ──────────────────────────── */

export const getWaitingTickets = (): Ticket[] => {
  const queue = loadQueue();
  return queue.tickets.filter((t) => t.status === "waiting" || !t.status);
};

export const getNoShowMetrics = () => {
  const queue = loadQueue();
  const noShows = queue.tickets.filter((t) => t.status === "no_show");
  const totalTickets = queue.tickets.length || 1;
  const totalLost = noShows.reduce((sum, t) => sum + (t.estimatedLoss || 150), 0);
  const rate = parseFloat(((noShows.length / totalTickets) * 100).toFixed(1));
  return {
    count: noShows.length,
    rate,
    totalLost,
    projectedMonthly: totalLost * 30,
  };
};
