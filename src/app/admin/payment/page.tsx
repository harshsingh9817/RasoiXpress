
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
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription as CardDescriptionElement
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Save, QrCode } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";

const paymentSettingsSchema = z.object({
  upiId: z.string().min(3, "UPI ID must be at least 3 characters long.").regex(/@/, "Please enter a valid UPI ID."),
  qrCodeImageUrl: z.string().url("Please enter a valid image URL."),
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline flex items-center">
                <CreditCard className="mr-3 h-6 w-6 text-primary" /> Payment Settings
              </CardTitle>
              <CardDescriptionElement>
                Configure UPI and QR code for checkout. Item-specific taxes and fees can be managed from the Menu page.
              </CardDescriptionElement>
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
