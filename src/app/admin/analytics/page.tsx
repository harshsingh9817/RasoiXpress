
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
import { BarChart2, DollarSign, TrendingUp, ShoppingBag, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { subDays } from "date-fns";

export default function AnalyticsPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const loadAnalytics = useCallback(async (filterDate?: DateRange) => {
    setIsDataLoading(true);
    try {
        const range = filterDate?.from && filterDate.to ? { from: filterDate.from, to: filterDate.to } : undefined;
        const data = await getAnalyticsData(range);
        setAnalyticsData(data);
    } catch (error) {
        console.error("Failed to load analytics data", error);
        toast({ title: "Error", description: "Could not load analytics.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const defaultDateRange = {
        from: subDays(new Date(), 6),
        to: new Date(),
      };
      setDate(defaultDateRange);
      loadAnalytics(defaultDateRange);
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, loadAnalytics]);

  const handleFilter = () => {
    if (date?.from && date?.to) {
        loadAnalytics(date);
    } else {
        toast({ title: "Invalid Date Range", description: "Please select both a start and end date.", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setDate(undefined);
    loadAnalytics();
  };
  
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
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
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
            An overview of your sales and revenue. Use the date picker to filter results.
          </CardDescription>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t mt-4">
                <DatePickerWithRange date={date} onDateChange={setDate} />
                <div className="flex gap-2">
                    <Button onClick={handleFilter}>
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                        <X className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                </div>
            </div>
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
              <CardDescription>Daily performance for the selected period.</CardDescription>
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
                    <p className="text-muted-foreground">No data to display for the selected period.</p>
                    <p className="text-xs text-muted-foreground">Try selecting a different date range or resetting the filter.</p>
                </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
}
