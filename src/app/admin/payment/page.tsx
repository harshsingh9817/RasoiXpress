
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
import { CreditCard, Save, KeyRound, MapPin, DollarSign, Radius, Timer } from "lucide-react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription as AlertDescriptionElement } from "@/components/ui/alert";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const paymentSettingsSchema = z.object({
  isRazorpayEnabled: z.boolean().optional(),
  isDeliveryFeeEnabled: z.boolean().optional(),
  deliveryRadiusKm: z.coerce.number().min(1, "Radius must be at least 1km.").optional(),
  orderExpirationMinutes: z.coerce.number().min(1, "Expiration must be at least 1 minute.").optional(),
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
      isRazorpayEnabled: true,
      isDeliveryFeeEnabled: true,
      deliveryRadiusKm: 5,
      orderExpirationMinutes: 5,
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
          isRazorpayEnabled: data.isRazorpayEnabled,
          isDeliveryFeeEnabled: data.isDeliveryFeeEnabled ?? true,
          deliveryRadiusKm: data.deliveryRadiusKm || 5,
          orderExpirationMinutes: data.orderExpirationMinutes || 5,
        });
      }
      loadSettings();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, form]);

  const onSubmit = async (data: PaymentSettingsFormValues) => {
    setIsSubmitting(true);
    try {
      await updatePaymentSettings({
        isRazorpayEnabled: data.isRazorpayEnabled,
        isDeliveryFeeEnabled: data.isDeliveryFeeEnabled,
        deliveryRadiusKm: data.deliveryRadiusKm,
        orderExpirationMinutes: data.orderExpirationMinutes,
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
                Manage payment gateways, delivery fees, and third-party service integrations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="isRazorpayEnabled"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Razorpay Payments</FormLabel>
                        <FormDescription>
                           Turn this on to accept online payments. If off, all orders will default to "Cash on Delivery".
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

              <div className="space-y-2">
                <h3 className="font-medium flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/> GoMaps Pro API Key</h3>
                 <p className="text-sm text-muted-foreground">
                    This key is used for the location picker and rider direction maps. It must be configured in your <code className="bg-muted px-1 py-0.5 rounded">.env</code> file under the variable <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GOMAPS_API_KEY</code>.
                 </p>
              </div>

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
        <AlertTitle>API Key Configuration</AlertTitle>
        <AlertDescriptionElement>
            Your Razorpay API Key ID and Key Secret are configured in the `.env` file for security. You must update them there to process live payments.
            You can get your keys from the{" "}
            <Link href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
                Razorpay Dashboard
            </Link>.
        </AlertDescriptionElement>
      </Alert>
    </div>
  );
}
