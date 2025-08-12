
"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getCoupons, addCoupon, updateCoupon, deleteCoupon } from "@/lib/data";
import type { Coupon } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Tag, Percent, PackageSearch, Edit, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters.").max(20, "Code cannot exceed 20 characters.").transform(v => v.toUpperCase()),
  discountPercent: z.coerce.number().min(1, "Discount must be at least 1%.").max(100, "Discount cannot exceed 100%."),
  validFrom: z.date({ required_error: "A start date is required." }),
  validUntil: z.date({ required_error: "An end date is required." }),
  status: z.enum(['active', 'inactive']),
}).refine(data => data.validUntil >= data.validFrom, {
    message: "End date cannot be before the start date.",
    path: ["validUntil"],
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function CouponManagementPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountPercent: 10,
      status: 'active',
    },
  });

  const loadCoupons = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const items = await getCoupons();
      setCoupons(items);
    } catch (error) {
      console.error("Failed to load coupons", error);
      toast({ title: "Error", description: "Could not load coupons.", variant: "destructive" });
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
      loadCoupons();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, loadCoupons]);

  const handleOpenFormDialog = (coupon: Coupon | null) => {
    setCouponToEdit(coupon);
    if (coupon) {
      form.reset({
        ...coupon,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
      });
    } else {
      form.reset({
        code: "",
        discountPercent: 10,
        status: 'active',
        validFrom: new Date(),
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
      });
    }
    setIsFormOpen(true);
  }

  const onSubmit = async (data: CouponFormValues) => {
    try {
        if (couponToEdit) {
            await updateCoupon({ id: couponToEdit.id, ...data });
            toast({ title: "Coupon Updated", description: `Coupon "${data.code}" has been updated.` });
        } else {
            await addCoupon(data);
            toast({ title: "Coupon Created", description: `Coupon "${data.code}" has been created.` });
        }
        await loadCoupons();
        setIsFormOpen(false);
    } catch (error: any) {
        console.error("Failed to save coupon", error);
        toast({ title: "Save Failed", description: error.message || "Could not save the coupon.", variant: "destructive" });
    }
  };

  const handleDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (couponToDelete) {
      try {
        await deleteCoupon(couponToDelete.id);
        toast({ title: "Coupon Deleted", description: `Coupon "${couponToDelete.code}" has been removed.` });
        await loadCoupons();
      } catch (error) {
        console.error("Failed to delete coupon", error);
        toast({ title: "Delete Failed", description: "Could not delete the coupon.", variant: "destructive" });
      }
    }
    setIsDeleteDialogOpen(false);
    setCouponToDelete(null);
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Verifying access..." : "Loading coupons..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center">
                <Tag className="mr-3 h-6 w-6 text-primary" /> Coupon Management
              </CardTitle>
              <CardDescription>
                Create, view, and manage promotional coupon codes for your customers. Expired coupons are automatically removed.
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenFormDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add New Coupon</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>{coupon.discountPercent}%</TableCell>
                    <TableCell>
                        {coupon.validFrom && coupon.validUntil
                            ? `${format(coupon.validFrom, "PPp")} - ${format(coupon.validUntil, "PPp")}`
                            : 'N/A'
                        }
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>{coupon.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="icon" onClick={() => handleOpenFormDialog(coupon)}>
                           <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit Coupon</span>
                       </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(coupon)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Coupon</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    No coupons found. Add one to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{couponToEdit ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the promotional coupon.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Coupon Code</FormLabel>
                            <FormControl>
                                <Input placeholder="E.g., SAVE20" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="discountPercent"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Discount Percentage</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input type="number" placeholder="20" {...field} className="pl-8"/>
                                    <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="validFrom"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Valid From</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPp") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus withTime />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="validUntil"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Valid Until</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPp") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus withTime />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Enable Coupon</FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value === 'active'}
                                onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div>}
                            {couponToEdit ? 'Save Changes' : 'Create Coupon'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
      </Dialog>


      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the coupon <span className="font-semibold">{couponToDelete?.code}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCouponToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
