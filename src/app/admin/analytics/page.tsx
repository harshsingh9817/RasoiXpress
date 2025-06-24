
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAnalyticsData } from "@/lib/data";
import type { AnalyticsData } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Loader2, BarChart2, DollarSign, TrendingUp, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AnalyticsPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const loadAnalytics = useCallback(() => {
    const data = getAnalyticsData();
    setAnalyticsData(data);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      setIsDataLoading(true);
      loadAnalytics();
      setIsDataLoading(false);
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, loadAnalytics]);
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'rasoiExpressAllOrders') {
        loadAnalytics();
        toast({
          title: "Analytics Synced",
          description: "Order data has changed, analytics have been updated.",
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadAnalytics, toast]);
  
  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
    profit: {
      label: "Profit (Est.)",
      color: "hsl(var(--accent))",
    },
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isAuthLoading ? "Verifying access..." : "Crunching the numbers..."}
        </p>
      </div>
    );
  }
  
  if (!analyticsData) {
      return <div>Error loading data.</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <BarChart2 className="mr-3 h-6 w-6 text-primary" /> Business Analytics
          </CardTitle>
          <CardDescription>
            An overview of your sales, revenue, and performance metrics.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">Rs.{analyticsData.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">From {analyticsData.totalOrders} delivered orders</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estimated Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">Rs.{analyticsData.totalProfit.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Based on an estimated 30% margin</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Delivered Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground"/>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">+{analyticsData.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Total orders successfully delivered</p>
              </CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
              <CardDescription>Revenue and estimated profit over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
              {analyticsData.chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analyticsData.chartData} accessibilityLayer>
                            <CartesianGrid vertical={false}/>
                             <XAxis 
                                dataKey="date" 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={8} 
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                             />
                             <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => `Rs.${value / 1000}k`}
                             />
                             <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                             <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4}/>
                             <Bar dataKey="profit" fill="var(--color-profit)" radius={4}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                    <BarChart2 className="h-12 w-12 text-muted-foreground/50 mb-2"/>
                    <p className="text-muted-foreground">Not enough data to display a chart.</p>
                    <p className="text-xs text-muted-foreground">Complete some orders to see performance data.</p>
                </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
}
