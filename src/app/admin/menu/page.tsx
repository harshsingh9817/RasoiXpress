"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getMenuItems, deleteMenuItem } from "@/lib/data";
import type { MenuItem } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Edit,
  Trash2,
  Utensils,
  CheckCircle,
  XCircle,
  Search,
  PackageSearch
} from "lucide-react";
import MenuItemFormDialog from "@/components/admin/MenuItemFormDialog";
import { useToast } from "@/hooks/use-toast";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function MenuManagementPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // New state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterVegetarian, setFilterVegetarian] = useState('All');
  const [filterPopular, setFilterPopular] = useState('All');


  const loadItems = useCallback(async () => {
    setIsDataLoading(true);
    try {
        const items = await getMenuItems();
        setMenuItems(items);
    } catch (error) {
        console.error("Failed to load menu items", error);
        toast({ title: "Error", description: "Could not load menu items.", variant: "destructive" });
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
        loadItems();
    }
  }, [isAdmin, isLoading, isAuthenticated, router, loadItems]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(categories)];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
        const term = searchTerm.toLowerCase();
        if (term && !(item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term))) {
            return false;
        }

        if (filterCategory !== 'All' && item.category !== filterCategory) {
            return false;
        }

        if (filterVegetarian !== 'All') {
            const isVeg = filterVegetarian === 'Yes';
            if (item.isVegetarian !== isVeg) return false;
        }

        if (filterPopular !== 'All') {
            const isPop = filterPopular === 'Yes';
            if (item.isPopular !== isPop) return false;
        }

        return true;
    });
  }, [menuItems, searchTerm, filterCategory, filterVegetarian, filterPopular]);


  const handleAddNew = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: MenuItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (itemToDelete) {
        try {
            await deleteMenuItem(itemToDelete.id);
            toast({ title: "Item Deleted", description: `${itemToDelete.name} has been removed.`});
            await loadItems(); // Refresh list after delete
        } catch (error) {
            console.error("Failed to delete item", error);
            toast({ title: "Delete Failed", description: "Could not delete the item.", variant: "destructive" });
        }
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  }

  if (isLoading || (!isAuthenticated && !isLoading) || (isDataLoading && menuItems.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          {isLoading ? "Verifying access..." : isDataLoading ? "Loading menu..." : "Access Denied. Redirecting..."}
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
                  <Utensils className="mr-3 h-6 w-6 text-primary" /> Menu Management
                </CardTitle>
                <CardDescription>
                  Add, edit, or remove food items available across all restaurants.
                  <p className="mt-1">
                    Search image on <a href="https://unsplash.com/search/photos/food" target="_blank" rel="noopener noreferrer" className="text-primary underline">UNSPLASH website</a>.
                  </p>
                </CardDescription>
              </div>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
          </div>
           <div className="flex flex-col md:flex-row items-center gap-4 pt-6">
              <div className="relative w-full md:w-auto md:flex-grow">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex w-full md:w-auto items-center gap-4">
                 <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 <Select value={filterVegetarian} onValueChange={setFilterVegetarian}>
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="Vegetarian?" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">Veg & Non-Veg</SelectItem>
                        <SelectItem value="Yes">Vegetarian</SelectItem>
                        <SelectItem value="No">Non-Veg</SelectItem>
                    </SelectContent>
                 </Select>
                 <Select value={filterPopular} onValueChange={setFilterPopular}>
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="Popular?" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Items</SelectItem>
                        <SelectItem value="Yes">Popular</SelectItem>
                        <SelectItem value="No">Not Popular</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Vegetarian</TableHead>
                <TableHead className="text-center">Popular</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMenuItems.length > 0 ? (
                filteredMenuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Image
                        src={item.imageUrl.includes('data-ai-hint') ? item.imageUrl.split('?data-ai-hint=')[0] : item.imageUrl.split('data-ai-hint=')[0]}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint={item.imageUrl.includes('data-ai-hint=') ? item.imageUrl.split('data-ai-hint=')[1] : `${item.name.split(" ")[0].toLowerCase()} ${item.category?.toLowerCase() || 'food'}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">Rs.{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {item.isVegetarian ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isPopular ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />}
                    </TableCell>
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    {menuItems.length === 0 ? "No menu items found. Add one to get started!" : "No menu items match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MenuItemFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onFormSubmit={loadItems}
        menuItem={selectedItem}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the item
                <span className="font-semibold"> {itemToDelete?.name} </span>
                and remove it from all restaurants.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
