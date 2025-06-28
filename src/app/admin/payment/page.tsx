
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/data";
import type { PaymentSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription as FormDescriptionComponent,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2, Save, QrCode } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const paymentSettingsSchema = z.object({
  upiId: z.string().min(3, "UPI ID must be at least 3 characters long.").regex(/@/, "Please enter a valid UPI ID."),
  qrCodeImageUrl: z.string().url("Please enter a valid image URL."),
  deliveryFee: z.coerce.number().min(0, "Delivery fee must be zero or more."),
  taxRate: z.coerce.number().min(0, "Tax rate must be zero or more.").max(1, "Tax rate should be a decimal (e.g., 0.05 for 5%)."),
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
      upiId: "",
      qrCodeImageUrl: "",
      deliveryFee: 49,
      taxRate: 0.05,
    },
  });

  const qrCodeUrl = form.watch("qrCodeImageUrl");

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const loadSettings = async () => {
        const data = await getPaymentSettings();
        form.reset(data);
      }
      loadSettings();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, form]);

  const onSubmit = async (data: PaymentSettingsFormValues) => {
    setIsSubmitting(true);
    try {
      await updatePaymentSettings(data);
      toast({
        title: "Settings Updated",
        description: "Payment and fee settings have been successfully updated.",
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
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline flex items-center">
                <CreditCard className="mr-3 h-6 w-6 text-primary" /> Payment & Fee Settings
              </CardTitle>
              <CardDescription>
                Configure UPI, QR code, delivery fees, and tax rates for checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div>
                    <h3 className="text-lg font-medium mb-2">UPI & QR Code</h3>
                     <FormField
                        control={form.control}
                        name="upiId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>UPI ID</FormLabel>
                            <FormControl>
                            <Input placeholder="your-upi@oksbi" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="qrCodeImageUrl"
                        render={({ field }) => (
                        <FormItem className="mt-4">
                            <FormLabel>QR Code Image URL</FormLabel>
                            <FormControl>
                            <Input placeholder="https://example.com/qr.png" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                 <Separator />
                 <div>
                    <h3 className="text-lg font-medium mb-2">Fees & Taxes</h3>
                    <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="deliveryFee"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Delivery Fee (Rs.)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="1" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="taxRate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tax Rate</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                                <FormDescriptionComponent className="text-xs">
                                    Enter as decimal, e.g., 0.05 for 5%.
                                </FormDescriptionComponent>
                                </FormItem>
                            )}
                        />
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center">
                    <QrCode className="mr-2 h-5 w-5" />
                    QR Code Preview
                </h3>
                <div className="p-4 bg-muted rounded-lg border flex justify-center items-center">
                  {qrCodeUrl ? (
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code Preview"
                      width={200}
                      height={200}
                      className="rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/200x200.png?text=Invalid+URL";
                      }}
                      data-ai-hint="qr code"
                    />
                  ) : (
                    <div className="h-[200px] w-[200px] bg-muted-foreground/20 rounded-md flex items-center justify-center text-sm text-muted-foreground">
                        Enter a URL to see a preview
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
             <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
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
