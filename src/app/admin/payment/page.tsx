
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/data";
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
import { CreditCard, Save, KeyRound, MapPin, DollarSign, Radius, Timer, Building } from "lucide-react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const paymentSettingsSchema = z.object({
  isDeliveryFeeEnabled: z.boolean().optional(),
  deliveryRadiusKm: z.coerce.number().min(1, "Radius must be at least 1km.").optional(),
  orderExpirationMinutes: z.coerce.number().min(1, "Expiration must be at least 1 minute.").optional(),
  mapApiUrl: z.string().min(1, "API Key is required."),
  merchantName: z.string().min(3, "Merchant name is required.").max(50, "Merchant name is too long."),
});

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema>;

export default function PaymentSettingsPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      isDeliveryFeeEnabled: true,
      deliveryRadiusKm: 5,
      orderExpirationMinutes: 5,
      mapApiUrl: "",
      merchantName: "Rasoi Xpress",
    },
  });

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const loadSettings = async () => {
        const data = await getPaymentSettings();
        form.reset({
          isDeliveryFeeEnabled: data.isDeliveryFeeEnabled ?? true,
          deliveryRadiusKm: data.deliveryRadiusKm || 5,
          orderExpirationMinutes: data.orderExpirationMinutes || 5,
          mapApiUrl: data.mapApiUrl || "",
          merchantName: data.merchantName || "Rasoi Xpress",
        });
      }
      loadSettings();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, form]);

  const onSubmit = async (data: PaymentSettingsFormValues) => {
    setIsSubmitting(true);
    try {
      await updatePaymentSettings({
        isDeliveryFeeEnabled: data.isDeliveryFeeEnabled,
        deliveryRadiusKm: data.deliveryRadiusKm,
        orderExpirationMinutes: data.orderExpirationMinutes,
        mapApiUrl: data.mapApiUrl,
        merchantName: data.merchantName,
        isRazorpayEnabled: true, // Always true
      });
      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully updated.",
      });
    } catch (error) {
      console.error("Failed to save payment settings", error);
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
                <CreditCard className="mr-3 h-6 w-6 text-primary" /> Payment & Integration Settings
              </CardTitle>
              <CardDescription>
                Manage Razorpay, delivery fees, and third-party service integrations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                            Turn this on to charge delivery fees based on distance for orders under the free delivery threshold.
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
                  name="deliveryRadiusKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Radius className="mr-2 h-4 w-4"/>Delivery Radius (in km)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="5" {...field} value={field.value ?? ''} />
                      </FormControl>
                       <FormDescription>
                          Set the maximum distance from the restaurant that you will deliver to.
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

              <FormField
                control={form.control}
                name="mapApiUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/> Mappls API Key</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter your Mappls API key..." {...field} value={field.value ?? ''} rows={3} />
                    </FormControl>
                      <FormDescription>
                          This key is required for location-based services like address autofill and delivery distance calculation. Get it from your Mappls dashboard.
                      </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
      
      <Alert>
        <KeyRound className="h-4 w-4" />
        <AlertTitle>Razorpay API Keys</AlertTitle>
        <AlertDescription>
            Your Razorpay API keys in the `.env` file are used to power the payment gateway.
        </AlertDescription>
      </Alert>
    </div>
  );
}
