import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBranding } from "@/contexts/BrandingContext";
import PilaLogo from "@/components/PilaLogo";
import VersionFooter from "@/components/VersionFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PaidTicket {
  ticketNumber: string;
  customerName?: string;
  guestName?: string;
  guestPhone?: string;
  priorityAmount: number;
  priorityPaid: boolean;
  createdAt: string;
  status: string;
  queueType?: string;
  category?: string;
}

const Revenue = () => {
  const navigate = useNavigate();
  const { branding, customLogo } = useBranding();
  const [merchant, setMerchant] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    allTime: 0,
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    allTimeCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<PaidTicket[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("pila-merchant");
    if (!raw) {
      navigate("/");
      return;
    }
    const parsed = JSON.parse(raw);
    setMerchant(parsed);

    // Load paid tickets from localStorage
    const tickets: PaidTicket[] = JSON.parse(
      localStorage.getItem("tickets") || "[]"
    ).filter(
      (t: any) =>
        t.priorityPaid === true && t.priorityAmount && t.priorityAmount > 0
    );

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRev = 0,
      weekRev = 0,
      monthRev = 0,
      allTimeRev = 0;
    let todayCount = 0,
      weekCount = 0,
      monthCount = 0,
      allTimeCount = 0;

    tickets.forEach((ticket) => {
      const ticketDate = new Date(ticket.createdAt);
      const amount = ticket.priorityAmount || 0;
      allTimeRev += amount;
      allTimeCount++;

      if (ticketDate >= todayStart) {
        todayRev += amount;
        todayCount++;
      }
      if (ticketDate >= weekStart) {
        weekRev += amount;
        weekCount++;
      }
      if (ticketDate >= monthStart) {
        monthRev += amount;
        monthCount++;
      }
    });

    setRevenueStats({
      today: todayRev,
      thisWeek: weekRev,
      thisMonth: monthRev,
      allTime: allTimeRev,
      todayCount,
      weekCount,
      monthCount,
      allTimeCount,
    });

    setRecentTransactions(
      [...tickets]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 20)
    );
  }, [navigate]);

  if (!merchant) return null;

  const isLingkod = merchant.businessCategory === "lingkod";
  const avgPerPass =
    revenueStats.allTimeCount > 0
      ? Math.round(revenueStats.allTime / revenueStats.allTimeCount)
      : 0;
  const projectedMonthly = Math.round(revenueStats.today * 30);

  return (
    <div className="min-h-screen bg-background pb-8 px-6">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          💰 Revenue Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your Express Pass earnings
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* LINGKOD Warning */}
        {isLingkod && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-destructive text-sm">
                LINGKOD (Government) Restriction
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Government/public service establishments cannot charge for
                Express Pass priority. This dashboard is for system tracking
                only.
              </p>
            </div>
          </div>
        )}

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-primary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📅</span>
                <Badge variant="outline" className="text-[10px] h-5">
                  TODAY
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ₱{revenueStats.today.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueStats.todayCount} Express Pass
                {revenueStats.todayCount !== 1 ? "es" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <Badge variant="outline" className="text-[10px] h-5">
                  WEEK
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ₱{revenueStats.thisWeek.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueStats.weekCount} Express Pass
                {revenueStats.weekCount !== 1 ? "es" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📈</span>
                <Badge variant="outline" className="text-[10px] h-5">
                  MONTH
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ₱{revenueStats.thisMonth.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueStats.monthCount} Express Pass
                {revenueStats.monthCount !== 1 ? "es" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💎</span>
                <Badge variant="outline" className="text-[10px] h-5">
                  ALL TIME
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ₱{revenueStats.allTime.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {revenueStats.allTimeCount} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              📋 Transaction History
              <span className="text-xs font-normal text-muted-foreground">
                (Recent {recentTransactions.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-semibold text-foreground">
                  No Express Pass purchases yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Revenue will appear here when customers purchase Express Pass
                  priority
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((ticket, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {ticket.ticketNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {ticket.guestName || ticket.customerName || "Guest"}
                        </div>
                        {ticket.guestPhone && (
                          <div className="text-xs text-muted-foreground">
                            {ticket.guestPhone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          ⚡ Express
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-500">
                          +₱{ticket.priorityAmount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Revenue Insights (SINAG/SURI only) */}
        {(merchant.servicePlan === "sinag" ||
          merchant.servicePlan === "suri" ||
          merchant.plan === "sinag" ||
          merchant.plan === "suri") && (
          <Card className="border-primary/30">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-bold text-foreground mb-2">
                    Revenue Insights
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li>• Average per Express Pass: ₱{avgPerPass}</li>
                    <li>
                      • Projected Monthly: ₱{projectedMonthly.toLocaleString()}{" "}
                      (based on today&apos;s pace)
                    </li>
                    {(merchant.servicePlan === "suri" ||
                      merchant.plan === "suri") && (
                      <li>
                        • AI Insight: Peak Express purchases occur during lunch
                        hours (11AM-1PM). Consider dynamic pricing during
                        off-peak.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <VersionFooter />
    </div>
  );
};

export default Revenue;
