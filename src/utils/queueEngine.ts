/**
 * Queue Engine: Core queue management and persistence
 */

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  status: 'waiting' | 'called' | 'serving' | 'served' | 'no_show' | 'cancelled';
  servicePace?: 'regular' | 'express' | 'priority';
  created_at: string;
  called_at?: string;
  served_at?: string;
  cancelledAt?: string;
  estimatedLoss?: number;
}

export interface Queue {
  tickets: Ticket[];
  lastTicketNumber: number;
  merchantId: string;
}

export const loadQueue = (): Queue => {
  const stored = localStorage.getItem('pila-queue');

  if (!stored) {
    const defaultQueue: Queue = {
      tickets: [],
      lastTicketNumber: 0,
      merchantId: 'default',
    };

    localStorage.setItem('pila-queue', JSON.stringify(defaultQueue));
    console.log('✅ Queue initialized with default object');
    return defaultQueue;
  }

  try {
    const parsed = JSON.parse(stored);
    // Ensure all required fields exist
    return {
      tickets: parsed.tickets || [],
      lastTicketNumber: parsed.lastTicketNumber || 0,
      merchantId: parsed.merchantId || 'default',
    };
  } catch {
    const defaultQueue: Queue = {
      tickets: [],
      lastTicketNumber: 0,
      merchantId: 'default',
    };
    localStorage.setItem('pila-queue', JSON.stringify(defaultQueue));
    return defaultQueue;
  }
};

export const saveQueue = (queue: Queue): void => {
  // STORAGE ADAPTER: Currently localStorage. To migrate to Supabase/Firebase,
  // change ONLY this function (and loadQueue) — the rest of the app is decoupled.
  localStorage.setItem('pila-queue', JSON.stringify(queue));
  // FUTURE: await supabase.from('queues').upsert(queue);
  console.log('💾 Queue saved:', queue.tickets.length, 'tickets');
};

/**
 * Add a ticket to the queue. Generates ID + createdAt automatically.
 * Caller provides ticketNumber (so existing R-/P- prefix logic still works).
 */
export const addTicketToQueue = (
  ticket: Omit<Ticket, 'id' | 'created_at' | 'status'> & { status?: Ticket['status'] }
): Ticket => {
  const queue = loadQueue();
  const newTicket: Ticket = {
    ...ticket,
    id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    status: ticket.status || 'waiting',
  };
  queue.tickets.push(newTicket);
  const numericPart = parseInt(ticket.ticketNumber.replace(/\D/g, ''), 10);
  if (!isNaN(numericPart)) {
    queue.lastTicketNumber = Math.max(queue.lastTicketNumber, numericPart);
  }
  saveQueue(queue);
  return newTicket;
};

/**
 * Update a ticket's status (and optional fields like called_at, served_at, cancelledAt).
 * Returns true if the ticket was found and updated.
 */
export const updateTicketStatus = (
  ticketId: string,
  status: Ticket['status'],
  additionalData?: Partial<Ticket>
): boolean => {
  const queue = loadQueue();
  const idx = queue.tickets.findIndex((t) => t.id === ticketId);
  if (idx === -1) return false;
  queue.tickets[idx] = { ...queue.tickets[idx], status, ...additionalData };
  saveQueue(queue);
  return true;
};

/**
 * Get all tickets that are still actively waiting (not called/served/no-show/cancelled).
 */
export const getWaitingTickets = (): Ticket[] => {
  const queue = loadQueue();
  return queue.tickets.filter((t) => t.status === 'waiting' || !t.status);
};

export const getNoShowMetrics = () => {
  const queue = loadQueue();
  const noShows = queue.tickets.filter(t => t.status === 'no_show');
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
