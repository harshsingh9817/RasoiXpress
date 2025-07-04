
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Rider } from "@/lib/types";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addRider, updateRider } from "@/lib/data";
import { useEffect, useState } from "react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";

const riderSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().regex(/^\d{10,}$/, "Please enter a valid phone number."),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


type RiderFormValues = z.infer<typeof riderSchema>;

interface RiderFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFormSubmit: () => void;
  rider?: Rider | null;
}

export default function RiderFormDialog({
  isOpen,
  onOpenChange,
  onFormSubmit,
  rider,
}: RiderFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<RiderFormValues>({
    resolver: zodResolver(riderSchema),
    defaultValues: {
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isOpen) {
        if (rider) {
          reset({ ...rider, password: '', confirmPassword: '' });
        } else {
          reset({
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
        }
    }
  }, [rider, reset, isOpen]);

  const onSubmit = async (data: RiderFormValues) => {
    setIsSubmitting(true);

    if (!rider && (!data.password || data.password.length < 6)) {
      form.setError("password", { type: "manual", message: "Password must be at least 6 characters." });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const riderData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
      };

      if (data.password) {
        riderData.password = data.password;
      }

      if (rider) {
        await updateRider({ ...riderData, id: rider.id });
        toast({ title: "Rider Updated", description: `${data.name} has been successfully updated.` });
      } else {
        await addRider(riderData as Omit<Rider, 'id'>);
        toast({ title: "Rider Added", description: `${data.name} has been successfully added.` });
      }
      onFormSubmit();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save rider:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving the rider's information.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rider ? "Edit Rider" : "Add New Rider"}</DialogTitle>
          <DialogDescription>
            {rider ? "Update the details for this rider." : "Fill in the details for the new rider."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={rider ? "Leave blank to keep unchanged" : "••••••••"} {...field} />
                  </FormControl>
                  <FormDescription>
                    {rider ? "" : "Password must be at least 6 characters."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div>}
                {isSubmitting ? 'Saving...' : (rider ? "Save Changes" : "Create Rider")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
