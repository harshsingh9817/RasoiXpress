
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getPaymentSettings, updatePaymentSettings, getRestaurantTime, updateRestaurantTime } from "@/lib/data";
import type { RestaurantTime } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Save, KeyRound, MapPin, DollarSign, Radius, Timer, Building, Clock } from "lucide-react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const settingsSchema = z.object({
  isDeliveryFeeEnabled: z.boolean().optional(),
  fixedDeliveryFee: z.coerce.number().min(0, "Fee must be a positive number.").optional(),
  orderExpirationMinutes: z.coerce.number().min(1, "Expiration must be at least 1 minute.").optional(),
  merchantName: z.string().min(3, "Merchant name is required.").max(50, "Merchant name is too long."),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter a valid 24-hour time (e.g., 09:00)."),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter a valid 24-hour time (e.g., 22:00)."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function PaymentSettingsPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      isDeliveryFeeEnabled: true,
      fixedDeliveryFee: 25,
      orderExpirationMinutes: 5,
      merchantName: "Rasoi Xpress",
      openTime: "10:00",
      closeTime: "22:00",
    },
  });

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const loadSettings = async () => {
        const [paymentData, timeData] = await Promise.all([
          getPaymentSettings(),
          getRestaurantTime(),
        ]);
        form.reset({
          isDeliveryFeeEnabled: paymentData.isDeliveryFeeEnabled ?? true,
          fixedDeliveryFee: paymentData.fixedDeliveryFee || 25,
          orderExpirationMinutes: paymentData.orderExpirationMinutes || 5,
          merchantName: paymentData.merchantName || "Rasoi Xpress",
          openTime: timeData.openTime || "10:00",
          closeTime: timeData.closeTime || "22:00",
        });
      }
      loadSettings();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);
    try {
      const paymentSettingsToUpdate = {
        isDeliveryFeeEnabled: data.isDeliveryFeeEnabled,
        fixedDeliveryFee: data.fixedDeliveryFee,
        orderExpirationMinutes: data.orderExpirationMinutes,
        merchantName: data.merchantName,
        isRazorpayEnabled: true,
      };
      
      const restaurantTimeToUpdate: RestaurantTime = {
        openTime: data.openTime,
        closeTime: data.closeTime,
      };

      await Promise.all([
        updatePaymentSettings(paymentSettingsToUpdate),
        updateRestaurantTime(restaurantTimeToUpdate),
      ]);

      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully updated.",
      });
    } catch (error) {
      console.error("Failed to save settings", error);
      toast({
        title: "Update Failed",
        description: "An error occurred while saving settings.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || (!isAuthenticated && !isAuthLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline flex items-center">
                <CreditCard className="mr-3 h-6 w-6 text-primary" /> General & Integration Settings
              </CardTitle>
              <CardDescription>
                Manage business hours, payments, delivery, and third-party service integrations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-4">
                 <h3 className="font-medium text-lg">Restaurant Hours</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="openTime"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center"><Clock className="mr-2 h-4 w-4"/>Open Time</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="closeTime"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center"><Clock className="mr-2 h-4 w-4"/>Close Time</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
               </div>

               <Separator />
               
               <div className="space-y-4">
                 <h3 className="font-medium text-lg">Payment Method</h3>
                  <Alert variant="default" className="border-primary/50 bg-primary/5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-bold">Razorpay is Enabled</AlertTitle>
                    <AlertDescription>
                      Your store exclusively uses the Razorpay payment gateway for all transactions.
                    </AlertDescription>
                  </Alert>

                 <FormField
                  control={form.control}
                  name="merchantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4"/>Merchant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business Name" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>The name that appears in the customer's payment app.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               </div>
              
               <Separator />
                
               <div className="space-y-4">
                 <h3 className="font-medium text-lg">Delivery & Order Settings</h3>
                 <FormField
                  control={form.control}
                  name="isDeliveryFeeEnabled"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center"><DollarSign className="mr-2 h-4 w-4"/>Enable Delivery Fees</FormLabel>
                          <FormDescription>
                            Turn this on to charge a fixed delivery fee on orders under the free delivery threshold.
                          </FormDescription>
                      </div>
                      <FormControl>
                          <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          />
                      </FormControl>
                      </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="fixedDeliveryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><DollarSign className="mr-2 h-4 w-4"/>Fixed Delivery Fee (in Rs)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="25" {...field} value={field.value ?? ''} />
                      </FormControl>
                       <FormDescription>
                          Set the fixed fee for delivery. This is waived for first-time orders and orders above Rs.300.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="orderExpirationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Timer className="mr-2 h-4 w-4"/>Order Expiration Time (in minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="5" {...field} value={field.value ?? ''} />
                      </FormControl>
                       <FormDescription>
                          If an order isn't confirmed by an admin within this time, it will automatically expire.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               </div>
              
              <Separator />

              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertTitle>Mappls & Razorpay API Keys</AlertTitle>
                <AlertDescription>
                    Your API keys in the `.env` file are used for location services and payment processing.
                </AlertDescription>
              </Alert>

            </CardContent>
             <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save All Settings
                    </>
                  )}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
