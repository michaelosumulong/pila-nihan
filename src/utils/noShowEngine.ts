/**
 * No-Show Engine with COPQ calculation, forced tracking, and leakage alerts
 */

export interface NoShowRecord {
  ticketId: string;
  ticketNumber: string;
  customerName: string;
  servicePace: string;
  timeCalled: string;
  timeMarkedNoShow: string;
  estimatedLoss: number;
  forced: boolean;
  reasonCode?: string;
}

export const NO_SHOW_REASONS = {
  EXPIRED: 'Timer expired (30+ min)',
  UNRESPONSIVE: 'Called multiple times, no response',
  LEFT_EARLY: 'Customer left before being served',
  WRONG_TIME: 'Customer came at wrong time',
  OTHER: 'Other reason',
} as const;

const COPQ_BY_PACE: Record<string, number> = {
  express: 500,
  standard: 200,
  technical: 100,
};

export const calculateNoShowDeadline = (calledAt: string): string => {
  const time = new Date(calledAt);
  return new Date(time.getTime() + 30 * 60000).toISOString();
};

export const isForcedNoShow = (calledAt: string): boolean => {
  const deadline = new Date(calculateNoShowDeadline(calledAt)).getTime();
  return Date.now() < deadline;
};

export const getCOPQ = (servicePace: string): number => {
  return COPQ_BY_PACE[servicePace] || 150;
};

export const recordNoShow = (record: Omit<NoShowRecord, 'estimatedLoss' | 'forced' | 'timeMarkedNoShow'> & { reasonCode?: string }): NoShowRecord => {
  const now = new Date().toISOString();
  const forced = isForcedNoShow(record.timeCalled);
  const estimatedLoss = getCOPQ(record.servicePace);

  const newRecord: NoShowRecord = {
    ...record,
    timeMarkedNoShow: now,
    estimatedLoss,
    forced,
    reasonCode: record.reasonCode || (forced ? 'FORCED' : NO_SHOW_REASONS.EXPIRED),
  };

  const history: NoShowRecord[] = JSON.parse(localStorage.getItem('pila-noshows') || '[]');
  history.unshift(newRecord);
  localStorage.setItem('pila-noshows', JSON.stringify(history));

  return newRecord;
};

export const getNoShowMetrics = () => {
  const today = new Date().toDateString();
  const history: NoShowRecord[] = JSON.parse(localStorage.getItem('pila-noshows') || '[]');

  const todayNoShows = history.filter(
    (ns) => new Date(ns.timeMarkedNoShow).toDateString() === today
  );

  const totalLost = todayNoShows.reduce((sum, ns) => sum + ns.estimatedLoss, 0);
  const forcedCount = todayNoShows.filter((ns) => ns.forced).length;

  // Get today's analytics for rate calculation
  const todayKey = new Date().toISOString().split('T')[0];
  const analyticsData = JSON.parse(localStorage.getItem('pila-analytics') || '{}');
  const todayAnalytics = analyticsData[todayKey] || { completed: 0, no_shows: 0 };
  const totalCalled = todayAnalytics.completed + todayAnalytics.no_shows;
  const rate = totalCalled > 0 ? (todayAnalytics.no_shows / totalCalled) * 100 : 0;

  return {
    count: todayNoShows.length,
    rate: Math.round(rate * 10) / 10,
    totalLost,
    projectedMonthly: totalLost * 30,
    projectedYearly: totalLost * 365,
    history: todayNoShows.slice(0, 10),
    forcedCount,
    forcedPercentage: todayNoShows.length > 0
      ? Math.round((forcedCount / todayNoShows.length) * 100)
      : 0,
  };
};

export const getNoShowAnalysis = () => {
  const history: NoShowRecord[] = JSON.parse(localStorage.getItem('pila-noshows') || '[]');
  if (history.length === 0) return null;

  const hours = history.map((ns) => new Date(ns.timeCalled).getHours());
  const hourCounts: Record<number, number> = {};
  hours.forEach((h) => (hourCounts[h] = (hourCounts[h] || 0) + 1));
  const peakHour = Object.keys(hourCounts).reduce((a, b) =>
    hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b
  );

  const noShowsByPace: Record<string, number> = {};
  history.forEach((ns) => {
    noShowsByPace[ns.servicePace] = (noShowsByPace[ns.servicePace] || 0) + 1;
  });

  const worstPace = Object.keys(noShowsByPace).length > 0
    ? Object.keys(noShowsByPace).reduce((a, b) =>
        noShowsByPace[a] > noShowsByPace[b] ? a : b
      )
    : 'standard';

  const totalForced = history.filter((ns) => ns.forced).length;

  return {
    peakHour: parseInt(peakHour),
    worstPace,
    totalForced,
    forcedRate: Math.round((totalForced / history.length) * 100),
  };
};
