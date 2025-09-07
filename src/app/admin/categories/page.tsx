"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getCategories, addCategory, updateCategory, deleteCategory } from "@/lib/data";
import type { Category } from "@/lib/types";
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
import { PlusCircle, Trash2, Edit, PackageSearch, LayoutGrid, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { uploadImage } from "@/lib/appwrite";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  imageUrl: z.string().url("Please upload an image."),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoryManagementPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", imageUrl: "" },
  });
  
  const { setValue } = form;

  const loadCategories = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const items = await getCategories();
      setCategories(items);
    } catch (error) {
      console.error("Failed to load categories", error);
      toast({ title: "Error", description: "Could not load categories.", variant: "destructive" });
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
      loadCategories();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, loadCategories]);

  const handleOpenFormDialog = (category: Category | null) => {
    setCategoryToEdit(category);
    setImageFile(null);
    if (category) {
      form.reset(category);
      setImagePreview(category.imageUrl);
    } else {
      form.reset({ name: "", imageUrl: "" });
      setImagePreview(null);
    }
    setIsFormOpen(true);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      let finalImageUrl = data.imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
        setValue("imageUrl", finalImageUrl);
      } else if (!categoryToEdit) {
        toast({ title: "Image Required", description: "Please upload an image for the new category.", variant: "destructive" });
        return;
      }

      const categoryData = { ...data, imageUrl: finalImageUrl };

      if (categoryToEdit) {
        await updateCategory({ id: categoryToEdit.id, ...categoryData });
        toast({ title: "Category Updated", description: `Category "${data.name}" has been updated.` });
      } else {
        await addCategory(categoryData);
        toast({ title: "Category Created", description: `Category "${data.name}" has been created.` });
      }
      await loadCategories();
      setIsFormOpen(false);
    } catch (error: any) {
        console.error("Failed to save category", error);
        toast({ title: "Save Failed", description: error.message || "Could not save the category.", variant: "destructive" });
    }
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id);
        toast({ title: "Category Deleted", description: `Category "${categoryToDelete.name}" has been removed.` });
        await loadCategories();
      } catch (error) {
        console.error("Failed to delete category", error);
        toast({ title: "Delete Failed", description: "Could not delete the category.", variant: "destructive" });
      }
    }
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Verifying access..." : "Loading categories..."}</p>
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
                <LayoutGrid className="mr-3 h-6 w-6 text-primary" /> Category Management
              </CardTitle>
              <CardDescription>
                Create, view, and manage food categories to organize your menu.
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenFormDialog(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add New Category</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        width={64}
                        height={64}
                        className="rounded-md object-contain"
                        data-ai-hint={category.name.toLowerCase()}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="icon" onClick={() => handleOpenFormDialog(category)}>
                           <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit Category</span>
                       </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(category)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Category</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    No categories found. Add one to get started!
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
              <DialogTitle>{categoryToEdit ? 'Edit Category' : 'Create New Category'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the food category.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                                <Input placeholder="E.g., Pizza" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                      <FormLabel>Category Image</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="file" 
                            onChange={handleImageChange} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            aria-label="Upload image"
                          />
                          <Button type="button" variant="outline" className="w-full" asChild>
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              {imageFile ? imageFile.name : "Choose an image"}
                            </label>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage>{form.formState.errors.imageUrl?.message}</FormMessage>
                    </FormItem>
                    
                    {imagePreview && (
                        <div className="space-y-2 pt-2">
                            <FormLabel>Image Preview</FormLabel>
                            <div className="p-2 border rounded-md flex justify-center items-center bg-muted/50 aspect-square w-32 mx-auto">
                            <Image
                                src={imagePreview}
                                alt="Image Preview"
                                width={100}
                                height={100}
                                className="rounded-md object-contain h-full w-full"
                                data-ai-hint="food category"
                            />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div>}
                            {categoryToEdit ? 'Save Changes' : 'Create Category'}
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
              This will permanently delete the category <span className="font-semibold">{categoryToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
