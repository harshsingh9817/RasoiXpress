
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { MenuItem } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addMenuItem, updateMenuItem } from "@/lib/data";
import { useEffect, useState } from "react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";

const menuItemSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  category: z.string().min(1, "Category is required."),
  imageUrl: z.string().url("Must be a valid URL."),
  isVegetarian: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  weight: z.string().optional(),
  ingredients: z.string().optional(),
  taxRate: z.coerce.number().min(0, "Tax rate must be zero or more.").max(1, "Tax rate should be a decimal (e.g., 0.05 for 5%).").optional(),
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

interface MenuItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFormSubmit: () => void; // Callback to refresh data
  menuItem?: MenuItem | null;
}

export default function MenuItemFormDialog({
  isOpen,
  onOpenChange,
  onFormSubmit,
  menuItem,
}: MenuItemFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      isVegetarian: false,
      isPopular: false,
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isOpen) {
        if (menuItem) {
          reset({...menuItem, taxRate: menuItem.taxRate || undefined});
        } else {
          reset({
            name: "",
            description: "",
            price: 0,
            category: "",
            imageUrl: "https://placehold.co/300x200.png",
            isVegetarian: false,
            isPopular: false,
            weight: "",
            ingredients: "",
            taxRate: undefined,
          });
        }
    }
  }, [menuItem, reset, isOpen]);

  const onSubmit = async (data: MenuItemFormValues) => {
    setIsSubmitting(true);
    try {
      const dataToSave = { ...data, taxRate: data.taxRate || 0 };
      if (menuItem) {
        await updateMenuItem({ ...dataToSave, id: menuItem.id });
        toast({ title: "Menu Item Updated", description: `${data.name} has been successfully updated.` });
      } else {
        await addMenuItem(dataToSave);
        toast({ title: "Menu Item Added", description: `${data.name} has been successfully added.` });
      }
      onFormSubmit();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save menu item:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving the menu item.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{menuItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
          <DialogDescription>
            {menuItem ? "Update the details for this food item." : "Fill in the details for the new food item."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Margherita Pizza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the item..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (in Rs.)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Pizza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://placehold.co/300x200.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Tax Rate (Optional)</FormLabel>
                      <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ''} placeholder="e.g. 0.05"/>
                      </FormControl>
                      <FormDescription className="text-xs">Enter as decimal, e.g., 0.05 for 5%. Leave blank for 0% tax.</FormDescription>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Approx. 450g" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredients (optional, comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="Flour, Tomato, Cheese" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center space-x-8 pt-2">
              <FormField
                control={form.control}
                name="isVegetarian"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                    <div className="space-y-0.5">
                      <FormLabel>Vegetarian</FormLabel>
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
                name="isPopular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                    <div className="space-y-0.5">
                      <FormLabel>Popular</FormLabel>
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
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div>}
                {isSubmitting ? 'Saving...' : (menuItem ? "Save Changes" : "Create Item")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
