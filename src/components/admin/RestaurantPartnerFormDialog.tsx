
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { RestaurantPartner } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addRestaurantPartner, updateRestaurantPartner } from "@/lib/data";
import { useEffect, useState } from "react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";

const partnerSchema = z.object({
  restaurantName: z.string().min(3, "Restaurant name must be at least 3 characters."),
  ownerName: z.string().min(3, "Owner name must be at least 3 characters."),
  ownerPhone: z.string().regex(/^\d{10}$/, "Must be a valid 10-digit phone number."),
  ownerEmail: z.string().email("Please enter a valid email address."),
  totalPayouts: z.coerce.number().min(0, "Payouts must be zero or more."),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

interface RestaurantPartnerFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFormSubmit: () => void; // Callback to refresh data
  partner?: RestaurantPartner | null;
}

export default function RestaurantPartnerFormDialog({
  isOpen,
  onOpenChange,
  onFormSubmit,
  partner,
}: RestaurantPartnerFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      restaurantName: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      totalPayouts: 0,
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isOpen) {
      if (partner) {
        reset(partner);
      } else {
        reset({
          restaurantName: "",
          ownerName: "",
          ownerPhone: "",
          ownerEmail: "",
          totalPayouts: 0,
        });
      }
    }
  }, [partner, reset, isOpen]);

  const onSubmit = async (data: PartnerFormValues) => {
    setIsSubmitting(true);
    try {
      if (partner) {
        await updateRestaurantPartner({ ...data, id: partner.id });
        toast({ title: "Partner Updated", description: `${data.restaurantName} has been successfully updated.` });
      } else {
        await addRestaurantPartner(data);
        toast({ title: "Partner Added", description: `${data.restaurantName} has been successfully added.` });
      }
      onFormSubmit();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save partner:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving the partner details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{partner ? "Edit Restaurant Partner" : "Add New Restaurant Partner"}</DialogTitle>
          <DialogDescription>
            Fill in the details for the restaurant partner.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
            <FormField
              control={form.control}
              name="restaurantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Name</FormLabel>
                  <FormControl><Input placeholder="Awesome Eats" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner's Full Name</FormLabel>
                  <FormControl><Input placeholder="Sunita Sharma" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner's Phone</FormLabel>
                  <FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner's Email</FormLabel>
                  <FormControl><Input type="email" placeholder="owner@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalPayouts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Payouts (in Rs.)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div>}
                {isSubmitting ? 'Saving...' : 'Save Details'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
