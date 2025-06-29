
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getRestaurantPartners, deleteRestaurantPartner } from "@/lib/data";
import type { RestaurantPartner } from "@/lib/types";
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
  Edit,
  Trash2,
  Store,
  PackageSearch
} from "lucide-react";
import RestaurantPartnerFormDialog from "@/components/admin/RestaurantPartnerFormDialog";
import { useToast } from "@/hooks/use-toast";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";

export default function RestaurantManagementPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [partners, setPartners] = useState<RestaurantPartner[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<RestaurantPartner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<RestaurantPartner | null>(null);

  const loadPartners = useCallback(async () => {
    setIsDataLoading(true);
    try {
        const items = await getRestaurantPartners();
        setPartners(items);
    } catch (error) {
        console.error("Failed to load partners", error);
        toast({ title: "Error", description: "Could not load restaurant partners.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
        loadPartners();
    }
  }, [isAdmin, isLoading, isAuthenticated, router, loadPartners]);

  const handleAddNew = () => {
    setSelectedPartner(null);
    setIsFormOpen(true);
  };

  const handleEdit = (partner: RestaurantPartner) => {
    setSelectedPartner(partner);
    setIsFormOpen(true);
  };

  const handleDelete = (partner: RestaurantPartner) => {
    setPartnerToDelete(partner);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (partnerToDelete) {
        try {
            await deleteRestaurantPartner(partnerToDelete.id);
            toast({ title: "Partner Deleted", description: `${partnerToDelete.restaurantName} has been removed.`});
            await loadPartners(); // Refresh list after delete
        } catch (error) {
            console.error("Failed to delete partner", error);
            toast({ title: "Delete Failed", description: "Could not delete the partner.", variant: "destructive" });
        }
    }
    setIsDeleteDialogOpen(false);
    setPartnerToDelete(null);
  }

  if (isLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <p className="text-xl text-muted-foreground mt-4">{isLoading ? "Verifying access..." : "Loading partners..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-headline flex items-center">
                  <Store className="mr-3 h-6 w-6 text-primary" /> Restaurant Partner Database
                </CardTitle>
                <CardDescription>
                  Manage restaurant partner data here, much like an Excel sheet. Only admins can modify this data.
                </CardDescription>
              </div>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Partner
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Owner Name</TableHead>
                <TableHead>Owner Phone</TableHead>
                <TableHead>Owner Email</TableHead>
                <TableHead className="text-right">Total Payouts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length > 0 ? (
                partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.restaurantName}</TableCell>
                    <TableCell>{partner.ownerName}</TableCell>
                    <TableCell>{partner.ownerPhone}</TableCell>
                    <TableCell>{partner.ownerEmail}</TableCell>
                    <TableCell className="text-right">Rs.{partner.totalPayouts.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Button variant="outline" size="icon" onClick={() => handleEdit(partner)}>
                           <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit</span>
                         </Button>
                         <Button variant="destructive" size="icon" onClick={() => handleDelete(partner)}>
                           <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete</span>
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    No restaurant partners found. Add one to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RestaurantPartnerFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFormSubmit={loadPartners}
        partner={selectedPartner}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the partner:
                <span className="font-semibold"> {partnerToDelete?.restaurantName}</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPartnerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
