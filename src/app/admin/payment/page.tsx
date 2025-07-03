
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
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Save, KeyRound } from "lucide-react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription as AlertDescriptionElement } from "@/components/ui/alert";
import Link from "next/link";

const paymentSettingsSchema = z.object({
  isRazorpayEnabled: z.boolean().optional(),
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
        form.reset({ isRazorpayEnabled: data.isRazorpayEnabled });
      }
      loadSettings();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, form]);

  const onSubmit = async (data: PaymentSettingsFormValues) => {
    setIsSubmitting(true);
    try {
      await updatePaymentSettings({ isRazorpayEnabled: data.isRazorpayEnabled });
      toast({
        title: "Settings Updated",
        description: "Payment settings have been successfully updated.",
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
                <CreditCard className="mr-3 h-6 w-6 text-primary" /> Razorpay Payment Settings
              </CardTitle>
              <CardDescription>
                Enable or disable online payments through Razorpay.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
             <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Setting
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
