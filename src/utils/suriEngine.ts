/**
 * SURI AI Engine: Lean Six Sigma Business Intelligence
 * Takt/Cycle/Lead Time, Muda Detection, DMAIC Recommendations
 */

import { getNoShowMetrics } from './noShowEngine';
import { loadQueue } from './queueEngine';

export interface SuriMetrics {
  avgCycleTime: number;
  avgLeadTime: number;
  taktTime: number;
  efficiency: number;
  mudaScore: number;
  sigma: number;
}

export interface MudaAnalysis {
  waiting: {
    type: string;
    waste: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  };
  overprocessing: {
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  };
  motion: {
    type: string;
    peakHours: number[];
    severity: 'low' | 'medium' | 'high';
    description: string;
  };
  abandonment: {
    type: string;
    count: number;
    rate: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  };
}

export interface CancellationAnalysis {
  totalCancelled: number;
  cancellationRate: number;
  peakCancellationHours: number[];
  mostCancelledServiceType: string;
  avgWaitTimeBeforeCancellation: number;
  severity: 'low' | 'medium' | 'high';
}

export interface DMAICrecommendation {
  id: string;
  timestamp: string;
  phase: 'DEFINE' | 'MEASURE' | 'ANALYZE' | 'IMPROVE' | 'CONTROL';
  category: 'takt' | 'cycle' | 'muda' | 'efficiency' | 'no-show';
  problem: string;
  recommendation: string;
  expectedImpact: string;
  estimatedROI: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'dismissed' | 'ignored';
  dismissReason?: string;
  implementedAt?: string;
  actualImpact?: number;
}

// Helper to load tickets from the shared queue model
const loadTickets = (): any[] => {
  try {
    const queue = loadQueue();
    return queue.tickets || [];
  } catch {
    return [];
  }
};

export const calculateSuriBasics = (): SuriMetrics | null => {
  const tickets = loadTickets();
  const completed = tickets.filter(
    (t: any) => t.status === 'served' && t.called_at && t.served_at
  );

  if (completed.length === 0) return null;

  const totalCycleTime = completed.reduce((acc: number, t: any) => {
    const start = new Date(t.called_at).getTime();
    const end = new Date(t.served_at).getTime();
    return acc + (end - start);
  }, 0);

  const totalLeadTime = completed.reduce((acc: number, t: any) => {
    const start = new Date(t.created_at || t.called_at).getTime();
    const end = new Date(t.served_at).getTime();
    return acc + (end - start);
  }, 0);

  const avgCycle = totalCycleTime / completed.length / 60000;
  const avgLead = totalLeadTime / completed.length / 60000;

  const totalTickets = tickets.length || 1;
  const taktTime = 480 / totalTickets; // 8-hour shift

  const efficiency = Math.min(100, Math.round((taktTime / Math.max(avgCycle, 0.1)) * 100));
  const mudaScore = 100 - efficiency;

  const sigma =
    efficiency >= 99 ? 6 :
    efficiency >= 95 ? 5 :
    efficiency >= 90 ? 4 :
    efficiency >= 80 ? 3 :
    efficiency >= 70 ? 2 : 1;

  return {
    avgCycleTime: Math.round(avgCycle * 10) / 10,
    avgLeadTime: Math.round(avgLead * 10) / 10,
    taktTime: Math.round(taktTime * 10) / 10,
    efficiency,
    mudaScore,
    sigma,
  };
};

export const detectMuda = (): MudaAnalysis => {
  const tickets = loadTickets();
  const noShowMetrics = getNoShowMetrics();

  // WAITING WASTE
  const waitingWaste = {
    type: 'No-Show Waste',
    waste: noShowMetrics.totalLost,
    severity: (noShowMetrics.rate > 15 ? 'high' : noShowMetrics.rate > 8 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
    description: `${noShowMetrics.count} no-shows today (${noShowMetrics.rate}% rate) = ₱${noShowMetrics.totalLost.toLocaleString()} lost`,
  };

  // OVERPROCESSING WASTE
  const expressTickets = tickets.filter(
    (t: any) => t.servicePace === 'express' && t.status === 'served' && t.called_at && t.served_at
  );
  const slowExpressCount = expressTickets.filter((t: any) => {
    const duration = (new Date(t.served_at).getTime() - new Date(t.called_at).getTime()) / 60000;
    return duration > 10;
  }).length;

  const overprocessing = {
    type: 'Express Service Delays',
    count: slowExpressCount,
    severity: (slowExpressCount > 5 ? 'high' : slowExpressCount > 2 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
    description: `${slowExpressCount} Express customers took >10 mins (should be fast-tracked)`,
  };

  // MOTION WASTE
  const ticketsByHour: Record<number, number> = {};
  tickets.forEach((t: any) => {
    const hour = new Date(t.created_at || t.called_at || Date.now()).getHours();
    ticketsByHour[hour] = (ticketsByHour[hour] || 0) + 1;
  });

  const hourValues = Object.values(ticketsByHour);
  const avgTicketsPerHour = hourValues.length > 0
    ? hourValues.reduce((a, b) => a + b, 0) / hourValues.length
    : 0;
  const peakHours = Object.keys(ticketsByHour)
    .filter((h) => ticketsByHour[parseInt(h)] > avgTicketsPerHour * 1.5)
    .map((h) => parseInt(h));

  const motion = {
    type: 'Peak Hour Congestion',
    peakHours,
    severity: (peakHours.length > 3 ? 'high' : peakHours.length > 1 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
    description: peakHours.length > 0
      ? `High congestion at ${peakHours.join(', ')}:00 hours`
      : 'No significant peak hour issues',
  };

  const cancellations = analyzeCancellations();

  return {
    waiting: waitingWaste,
    overprocessing,
    motion,
    abandonment: {
      type: 'Customer Abandonment',
      count: cancellations.totalCancelled,
      rate: cancellations.cancellationRate,
      severity: cancellations.severity,
      description: `${cancellations.totalCancelled} customers left queue (${cancellations.cancellationRate}% abandonment rate)`,
    },
  };
};

export const analyzeCancellations = (): CancellationAnalysis => {
  const tickets = loadTickets();
  const cancelled = tickets.filter((t: any) => t.status === 'cancelled');
  const total = tickets.length || 1;

  const cancellationRate = Math.round((cancelled.length / total) * 100 * 10) / 10;

  const hourCounts: Record<number, number> = {};
  cancelled.forEach((t: any) => {
    if (t.cancelledAt) {
      const hour = new Date(t.cancelledAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const peakCancellationHours = Object.keys(hourCounts)
    .filter((h) => hourCounts[parseInt(h)] >= 2)
    .map((h) => parseInt(h));

  const serviceCounts = cancelled.reduce((acc: Record<string, number>, t: any) => {
    const pace = t.servicePace || 'regular';
    acc[pace] = (acc[pace] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCancelledServiceType =
    Object.keys(serviceCounts).sort((a, b) => serviceCounts[b] - serviceCounts[a])[0] || 'none';

  const waitTimes = cancelled
    .filter((t: any) => t.created_at && t.cancelledAt)
    .map(
      (t: any) =>
        (new Date(t.cancelledAt).getTime() - new Date(t.created_at).getTime()) / 60000
    );

  const avgWaitTimeBeforeCancellation =
    waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a: number, b: number) => a + b, 0) / waitTimes.length)
      : 0;

  const severity: 'low' | 'medium' | 'high' =
    cancellationRate > 20 ? 'high' : cancellationRate > 10 ? 'medium' : 'low';

  return {
    totalCancelled: cancelled.length,
    cancellationRate,
    peakCancellationHours,
    mostCancelledServiceType,
    avgWaitTimeBeforeCancellation,
    severity,
  };
};

export const generateDMAICRecommendations = (): DMAICrecommendation[] => {
  const metrics = calculateSuriBasics();
  const muda = detectMuda();
  const noShowMetrics = getNoShowMetrics();
  const recommendations: DMAICrecommendation[] = [];

  if (!metrics) return [];

  if (metrics.efficiency < 80) {
    recommendations.push({
      id: `define-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      phase: 'DEFINE',
      category: 'efficiency',
      problem: `Service efficiency at ${metrics.efficiency}% (target: 80%+)`,
      recommendation: 'Establish baseline performance metrics and identify efficiency gaps',
      expectedImpact: 'Clear understanding of performance vs target',
      estimatedROI: 0,
      priority: 'high',
      status: 'pending',
    });
  }

  if (metrics.avgCycleTime > metrics.taktTime * 1.2) {
    const gap = Math.round(metrics.avgCycleTime - metrics.taktTime);
    recommendations.push({
      id: `measure-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      phase: 'MEASURE',
      category: 'cycle',
      problem: `Cycle Time (${metrics.avgCycleTime} min) exceeds Takt Time (${metrics.taktTime} min)`,
      recommendation: `Service time needs to decrease by ${gap} minutes per customer`,
      expectedImpact: `Serve customers ${gap} mins faster`,
      estimatedROI: gap * 100,
      priority: 'high',
      status: 'pending',
    });
  }

  if (muda.waiting.severity === 'high') {
    recommendations.push({
      id: `analyze-${Date.now()}-3`,
      timestamp: new Date().toISOString(),
      phase: 'ANALYZE',
      category: 'no-show',
      problem: `High no-show rate (${noShowMetrics.rate}%) causing ₱${noShowMetrics.totalLost.toLocaleString()} daily loss`,
      recommendation: 'Root cause: No reminder system. Customers forget appointments.',
      expectedImpact: 'Identify why customers fail to show up',
      estimatedROI: 0,
      priority: 'high',
      status: 'pending',
    });
  }

  if (noShowMetrics.rate > 10) {
    const potentialSavings = Math.round(noShowMetrics.projectedMonthly * 0.4);
    recommendations.push({
      id: `improve-${Date.now()}-4`,
      timestamp: new Date().toISOString(),
      phase: 'IMPROVE',
      category: 'no-show',
      problem: `No-shows costing ₱${noShowMetrics.projectedMonthly.toLocaleString()}/month`,
      recommendation: 'Implement SMS reminder system 30 mins before scheduled time',
      expectedImpact: 'Reduce no-shows by 40% (industry standard with reminders)',
      estimatedROI: potentialSavings,
      priority: 'high',
      status: 'pending',
    });
  }

  if (muda.overprocessing.severity !== 'low') {
    recommendations.push({
      id: `improve-overprocess-${Date.now()}-5`,
      timestamp: new Date().toISOString(),
      phase: 'IMPROVE',
      category: 'efficiency',
      problem: `${muda.overprocessing.count} Express customers experienced delays`,
      recommendation: 'Create dedicated Express lane or prioritize Express in queue',
      expectedImpact: 'Improve Express customer satisfaction by 60%',
      estimatedROI: 3000,
      priority: 'medium',
      status: 'pending',
    });
  }

  if (muda.motion.peakHours.length > 0) {
    recommendations.push({
      id: `improve-peak-${Date.now()}-6`,
      timestamp: new Date().toISOString(),
      phase: 'IMPROVE',
      category: 'takt',
      problem: `Peak congestion at ${muda.motion.peakHours.join(', ')}:00 hours`,
      recommendation: `Add 1 additional counter during ${muda.motion.peakHours.join(', ')}:00 peak hours`,
      expectedImpact: 'Reduce wait time by 35% during peak hours',
      estimatedROI: 5000,
      priority: 'medium',
      status: 'pending',
    });
  }

  recommendations.push({
    id: `control-${Date.now()}-7`,
    timestamp: new Date().toISOString(),
    phase: 'CONTROL',
    category: 'efficiency',
    problem: 'Need ongoing monitoring to sustain improvements',
    recommendation: 'Track weekly no-show rate, cycle time, and efficiency metrics',
    expectedImpact: 'Maintain <10% no-show rate and >85% efficiency',
    estimatedROI: 0,
    priority: 'low',
    status: 'pending',
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export const trackRecommendation = (
  recommendationId: string,
  action: 'accept' | 'dismiss',
  reason?: string
): boolean => {
  const history: DMAICrecommendation[] = JSON.parse(
    localStorage.getItem('pila-suri-recommendations') || '[]'
  );

  const index = history.findIndex((r) => r.id === recommendationId);
  if (index === -1) return false;

  history[index].status = action === 'accept' ? 'accepted' : 'dismissed';
  if (reason) history[index].dismissReason = reason;
  if (action === 'accept') history[index].implementedAt = new Date().toISOString();

  localStorage.setItem('pila-suri-recommendations', JSON.stringify(history));
  return true;
};

export const getAdoptionScore = () => {
  const history: DMAICrecommendation[] = JSON.parse(
    localStorage.getItem('pila-suri-recommendations') || '[]'
  );

  const total = history.length;
  const accepted = history.filter((r) => r.status === 'accepted').length;
  const dismissed = history.filter((r) => r.status === 'dismissed').length;
  const ignored = history.filter(
    (r) =>
      r.status === 'pending' &&
      Date.now() - new Date(r.timestamp).getTime() > 7 * 24 * 60 * 60 * 1000
  ).length;

  const adoptionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const totalPotentialROI = history.reduce((sum, r) => sum + r.estimatedROI, 0);
  const acceptedROI = history
    .filter((r) => r.status === 'accepted')
    .reduce((sum, r) => sum + r.estimatedROI, 0);

  return {
    total,
    accepted,
    dismissed,
    ignored,
    adoptionRate,
    grade: adoptionRate >= 80 ? 'A' : adoptionRate >= 60 ? 'B' : adoptionRate >= 40 ? 'C' : 'D',
    totalPotentialROI,
    acceptedROI,
    missedOpportunity: totalPotentialROI - acceptedROI,
  };
};
