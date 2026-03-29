/**
 * Queue Engine: Core queue management and persistence
 */

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  status: 'waiting' | 'called' | 'serving' | 'served' | 'no_show';
  servicePace?: 'regular' | 'express' | 'priority';
  created_at: string;
  called_at?: string;
  served_at?: string;
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
  localStorage.setItem('pila-queue', JSON.stringify(queue));
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
