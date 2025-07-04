
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { addRider, getRiders, deleteRider, listenToAllOrders, clearRiderDeliveryCount } from "@/lib/data";
import type { Rider, Order } from "@/lib/types";
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
  } from "@/components/ui/alert-dialog"
import {
  PlusCircle,
  Trash2,
  Bike,
  User,
  Phone,
  ClipboardCheck,
  RefreshCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";


const riderSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().regex(/^\d{10,}$/, "Please enter a valid phone number."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RiderFormValues = z.infer<typeof riderSchema>;

export default function RiderManagementPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [riders, setRiders] = useState<Rider[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);
  
  const [isClearCountDialogOpen, setIsClearCountDialogOpen] = useState(false);
  const [riderToClear, setRiderToClear] = useState<Rider | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RiderFormValues>({
    resolver: zodResolver(riderSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loadRiders = useCallback(async () => {
    try {
        const riderItems = await getRiders();
        setRiders(riderItems);
    } catch (error) {
        console.error("Failed to load riders", error);
        toast({ title: "Error", description: "Could not load riders.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
        setIsDataLoading(true);
        loadRiders();
        
        const unsubscribe = listenToAllOrders((orderItems) => {
            setOrders(orderItems);
            setIsDataLoading(false);
        });

        return () => unsubscribe();
    }
  }, [isAdmin, isLoading, isAuthenticated, router, loadRiders]);

  const ridersWithStats = useMemo(() => {
    if (!riders || !orders) return [];
    return riders.map(rider => {
        const lastPaymentDate = rider.lastPaymentDate?.toDate ? rider.lastPaymentDate.toDate() : null;
        const deliveredCount = orders.filter(order =>
            order.deliveryRiderId === rider.id &&
            order.status === 'Delivered' &&
            (!lastPaymentDate || new Date(order.date) > lastPaymentDate)
        ).length;
        return { ...rider, deliveredCount };
    });
  }, [riders, orders]);


  const handleDelete = (rider: Rider) => {
    setRiderToDelete(rider);
    setIsDeleteDialogOpen(true);
  };
  
  const handleClearCount = (rider: Rider) => {
    setRiderToClear(rider);
    setIsClearCountDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (riderToDelete) {
        try {
            await deleteRider(riderToDelete.id);
            toast({ title: "Rider Removed", description: `${riderToDelete.fullName} has been removed from the delivery team.`});
            await loadRiders(); // Refresh list after delete
        } catch (error) {
            console.error("Failed to delete rider", error);
            toast({ title: "Delete Failed", description: "Could not remove the rider.", variant: "destructive" });
        }
    }
    setIsDeleteDialogOpen(false);
    setRiderToDelete(null);
  }

  const confirmClearCount = async () => {
    if (riderToClear) {
        try {
            await clearRiderDeliveryCount(riderToClear.id);
            toast({ title: "Count Cleared", description: `Delivery count for ${riderToClear.fullName} has been reset.`});
            await loadRiders();
        } catch (error) {
            console.error("Failed to clear count", error);
            toast({ title: "Clear Failed", description: "Could not clear the count.", variant: "destructive" });
        }
    }
    setIsClearCountDialogOpen(false);
    setRiderToClear(null);
  }
  
  const onSubmit = async (data: RiderFormValues) => {
    try {
      await addRider(data.fullName, data.email, data.phone, data.password);
      toast({
        title: "Rider Account Created",
        description: `${data.fullName}'s account has been created. They can now log in.`,
      });
      form.reset();
      await loadRiders();
    } catch (error: any) {
      console.error("Failed to add rider", error);
      toast({
        title: "Failed to Add Rider",
        description: error.message || "An error occurred while adding the rider.",
        variant: "destructive",
      });
    }
  };


  if (isLoading || (!isAuthenticated && !isLoading) || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          Verifying access...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center">
                  <PlusCircle className="mr-3 h-6 w-6 text-primary" /> Add New Rider
                </CardTitle>
                <CardDescription>
                  Create a new account for a member of the delivery team. They will be able to log in with the email and password you set.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                <Input placeholder="Sunil Kumar" {...field} />
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
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                <Input placeholder="rider@example.com" {...field} />
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
                                    <div className="relative">
                                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                            <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                                        </Button>
                                    </div>
                                </FormControl>
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
                                    <div className="relative">
                                        <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                            <span className="sr-only">{showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}</span>
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (
                            <>
                                <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> Adding...
                            </>
                            ) : (
                            <>
                                <User className="mr-2 h-4 w-4" /> Add Rider
                            </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
              <Bike className="mr-3 h-6 w-6 text-primary" /> Delivery Team
            </CardTitle>
            <CardDescription>
              List of all active delivery riders.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isDataLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-20 h-20 text-primary">
                        <AnimatedPlateSpinner />
                    </div>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-center">Delivered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {ridersWithStats.length > 0 ? (
                        ridersWithStats.map((rider) => (
                        <TableRow key={rider.id}>
                            <TableCell className="font-medium">{rider.fullName}</TableCell>
                            <TableCell>{rider.email}</TableCell>
                            <TableCell>{rider.phone}</TableCell>
                            <TableCell className="text-center font-medium">
                                <div className="flex items-center justify-center gap-1">
                                    <ClipboardCheck className="h-4 w-4 text-green-600" />
                                    {rider.deliveredCount}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild variant="outline" size="icon">
                                        <a href={`tel:${rider.phone}`} aria-label={`Call ${rider.fullName}`}>
                                            <Phone className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleClearCount(rider)}>
                                        <RefreshCcw className="h-4 w-4" />
                                        <span className="sr-only">Clear Delivery Count</span>
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(rider)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remove Rider</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No riders found.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            )}
            </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will remove <span className="font-semibold"> {riderToDelete?.fullName} </span> from the delivery team. Their account will still exist, but they will lose delivery access. This action can be reversed by adding them again.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRiderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Remove
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isClearCountDialogOpen} onOpenChange={setIsClearCountDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Clear Delivery Count?</AlertDialogTitle>
            <AlertDialogDescription>
                This will reset the delivery count for <span className="font-semibold"> {riderToClear?.fullName} </span> to zero. This should only be done after the rider has been paid for their completed deliveries.
                <br/><br/>
                This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRiderToClear(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearCount}>
                Confirm & Clear
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
