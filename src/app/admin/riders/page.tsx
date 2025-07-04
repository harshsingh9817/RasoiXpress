
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getRiders, deleteRider } from "@/lib/data";
import type { Rider } from "@/lib/types";
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
  Bike,
  Search,
} from "lucide-react";
import RiderFormDialog from "@/components/admin/RiderFormDialog";
import { useToast } from "@/hooks/use-toast";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Input } from "@/components/ui/input";

export default function RiderManagementPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [riders, setRiders] = useState<Rider[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const loadRiders = useCallback(async () => {
    setIsDataLoading(true);
    try {
        const items = await getRiders();
        setRiders(items);
    } catch (error) {
        console.error("Failed to load riders", error);
        toast({ title: "Error", description: "Could not load riders.", variant: "destructive" });
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
        loadRiders();
    }
  }, [isAdmin, isLoading, isAuthenticated, router, loadRiders]);


  const filteredRiders = useMemo(() => {
    return riders.filter(item => {
        const term = searchTerm.toLowerCase();
        if (term && !(item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term) || item.phone.toLowerCase().includes(term))) {
            return false;
        }
        return true;
    });
  }, [riders, searchTerm]);


  const handleAddNew = () => {
    setSelectedRider(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Rider) => {
    setSelectedRider(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: Rider) => {
    setRiderToDelete(item);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (riderToDelete) {
        try {
            await deleteRider(riderToDelete.id);
            toast({ title: "Rider Removed", description: `${riderToDelete.name} has been removed from the system.`});
            await loadRiders(); // Refresh list after delete
        } catch (error) {
            console.error("Failed to delete rider", error);
            toast({ title: "Delete Failed", description: "Could not delete the rider.", variant: "destructive" });
        }
    }
    setIsDeleteDialogOpen(false);
    setRiderToDelete(null);
  }

  if (isLoading || (!isAuthenticated && !isLoading) || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          {isLoading ? "Verifying access..." : isDataLoading ? "Loading riders..." : "Access Denied. Redirecting..."}
        </p>
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
                  <Bike className="mr-3 h-6 w-6 text-primary" /> Rider Management
                </CardTitle>
                <CardDescription>
                  Add, edit, or remove delivery riders from the system.
                </CardDescription>
              </div>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Rider
              </Button>
          </div>
           <div className="flex flex-col md:flex-row items-center gap-4 pt-6">
              <div className="relative w-full md:w-auto md:flex-grow">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiders.length > 0 ? (
                filteredRiders.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                           <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit</span>
                         </Button>
                         <Button variant="destructive" size="icon" onClick={() => handleDelete(item)}>
                           <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete</span>
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Bike className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    {riders.length === 0 ? "No riders found. Add one to get started!" : "No riders match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RiderFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFormSubmit={loadRiders}
        rider={selectedRider}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the rider
                <span className="font-semibold"> {riderToDelete?.name} </span>
                from the system.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRiderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
