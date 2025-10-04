
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getHeroData, updateHeroData, getMenuItems, getCategories } from "@/lib/data";
import type { HeroData, HeroMedia, MenuItem, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LayoutTemplate, Save, PlusCircle, Trash2, Upload, Timer, Video, Image as ImageIcon, Text, Link2, Pizza, AppWindow, MoveVertical } from "lucide-react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { uploadImage } from "@/lib/appwrite";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const heroMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  src: z.string().url("Please upload a file for each slide."),
  order: z.coerce.number().min(1, "Order must be at least 1."),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  linkType: z.enum(['none', 'item', 'category', 'menu', 'categories']).optional().default('none'),
  linkValue: z.string().optional(),
  textPosition: z.enum(['bottom-left', 'bottom-center', 'bottom-right', 'center-left', 'center-center', 'center-right', 'top-left', 'top-center', 'top-right']).optional().default('bottom-left'),
  fontSize: z.enum(['sm', 'md', 'lg', 'xl']).optional().default('md'),
  fontFamily: z.enum(['sans', 'serif', 'headline']).optional().default('sans'),
});

const heroSchema = z.object({
  slideInterval: z.coerce.number().min(1, "Interval must be at least 1 second.").default(5),
  orderingTime: z.string().optional(),
  media: z.array(heroMediaSchema).min(1, "You must have at least one slide."),
});

type HeroFormValues = z.infer<typeof heroSchema>;
type MediaFile = { file: File | null; preview: string; type: 'image' | 'video' };

export default function HeroManagementPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mediaIndexToDelete, setMediaIndexToDelete] = useState<number | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialHeroData, setInitialHeroData] = useState<HeroData | null>(null);

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroSchema),
    defaultValues: { media: [], slideInterval: 5, orderingTime: '' },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "media",
  });

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const loadData = async () => {
        setIsDataLoading(true);
        try {
            const [data, items, cats] = await Promise.all([getHeroData(), getMenuItems(true), getCategories()]);
            
            if (data.media && Array.isArray(data.media)) {
              data.media.sort((a, b) => (a.order || 99) - (b.order || 99));
            }
            
            setInitialHeroData(data); // Store initial data
            setMenuItems(items);
            setCategories(cats);

            form.reset({
              slideInterval: data.slideInterval || 5,
              orderingTime: data.orderingTime || '10:00 AM - 10:00 PM',
              media: data.media || [],
            });
            setMediaFiles(data.media?.map(m => ({ file: null, preview: m.src, type: m.type })) || []);
        } catch (error) {
            console.error("Error loading hero data:", error);
            toast({ title: "Error", description: "Could not load hero settings.", variant: "destructive" });
        } finally {
            setIsDataLoading(false);
        }
      };
      loadData();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, form, toast]);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newMediaFiles = [...mediaFiles];
      const reader = new FileReader();
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      reader.onloadend = () => {
        const result = reader.result as string;
        newMediaFiles[index] = { file, preview: result, type: fileType };
        setMediaFiles(newMediaFiles);
        form.setValue(`media.${index}.src`, 'https://placehold.co/1.png', { shouldValidate: true });
        form.setValue(`media.${index}.type`, fileType, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: HeroFormValues) => {
    setIsSubmitting(true);
    try {
      const uploadedMediaUrls = await Promise.all(
        mediaFiles.map(async (mediaFile) => {
          if (mediaFile.file) {
            return await uploadImage(mediaFile.file);
          }
          // If no new file, return the existing preview URL which should be the original URL
          return mediaFile.preview;
        })
      );

      const updatedMedia = data.media.map((item, index) => ({
        ...item,
        src: uploadedMediaUrls[index],
        type: mediaFiles[index].type,
        linkValue: item.linkType === 'none' ? '' : item.linkValue,
      }));

      const finalDataToSave: HeroData = {
        slideInterval: data.slideInterval,
        orderingTime: data.orderingTime,
        media: updatedMedia,
      };

      await updateHeroData(finalDataToSave);
      toast({
        title: "Hero Section Updated",
        description: "The homepage hero has been successfully updated.",
      });
      // After successful save, we should reload the data to sync the state
      const reloadedData = await getHeroData();
      if (reloadedData.media && Array.isArray(reloadedData.media)) {
        reloadedData.media.sort((a, b) => (a.order || 99) - (b.order || 99));
      }
      setInitialHeroData(reloadedData);
      form.reset(reloadedData);
      setMediaFiles(reloadedData.media?.map(m => ({ file: null, preview: m.src, type: m.type })) || []);

    } catch (error) {
      console.error("Failed to save hero data", error);
      toast({
        title: "Update Failed",
        description: "An error occurred while saving the hero section data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedia = (index: number) => {
    setMediaIndexToDelete(index);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (mediaIndexToDelete !== null) {
      remove(mediaIndexToDelete);
      
      const newMediaFiles = [...mediaFiles];
      newMediaFiles.splice(mediaIndexToDelete, 1);
      setMediaFiles(newMediaFiles);
      
      if (initialHeroData && initialHeroData.media) {
        const newInitialMedia = [...initialHeroData.media];
        newInitialMedia.splice(mediaIndexToDelete, 1);
        setInitialHeroData({ ...initialHeroData, media: newInitialMedia });
      }

      toast({
        title: "Slide Removed",
        description: "The slide has been removed. Click 'Save All Changes' to make it permanent.",
      });
    }
    setIsDeleteDialogOpen(false);
    setMediaIndexToDelete(null);
  };

  const handleAddSlide = () => {
    const newOrder = fields.length > 0 ? Math.max(...fields.map(f => f.order || 0)) + 1 : 1;
    append({ type: 'image', src: 'https://placehold.co/1280x720.png', order: newOrder, headline: '', subheadline: '', linkType: 'none', linkValue: '', textPosition: 'bottom-left', fontSize: 'md', fontFamily: 'sans' });
    setMediaFiles([...mediaFiles, { file: null, preview: 'https://placehold.co/1280x720.png', type: 'image' }]);
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Verifying access..." : "Loading settings..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-headline flex items-center">
                    <LayoutTemplate className="mr-3 h-6 w-6 text-primary" /> Edit Homepage Hero
                  </CardTitle>
                  <CardDescription>
                    Manage slides, text overlays, ordering times, and autoplay speed for the homepage carousel.
                  </CardDescription>
                </div>
                <Button type="submit" disabled={isSubmitting} className="shrink-0">
                  {isSubmitting ? <><div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save All Changes</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="slideInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Timer className="mr-2 h-4 w-4 text-primary" /> Slide Change Time</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5" {...field} />
                        </FormControl>
                        <FormDescription>Time in seconds before the carousel automatically moves to the next slide.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="orderingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Timer className="mr-2 h-4 w-4 text-primary" /> Ordering Hours</FormLabel>
                        <FormControl>
                          <Input placeholder="10:00 AM - 10:00 PM" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>The time window when users can place orders.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium">Manage Slides</h3>
                <p className="text-sm text-muted-foreground">Add or remove slides. Set order, text, links, and styles for each.</p>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-4 items-end">
                          <FormField control={form.control} name={`media.${index}.order`} render={({ field }) => (
                              <FormItem><FormLabel>Order</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                          />
                          <FormItem>
                            <FormLabel>Upload Image or Video</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="file" accept="image/*,video/*" onChange={(e) => handleFileChange(index, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label={`Upload slide ${index + 1}`}/>
                                <Button type="button" variant="outline" className="w-full" asChild>
                                  <label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />{mediaFiles[index]?.file?.name || "Choose file"}</label>
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage>{form.formState.errors.media?.[index]?.src?.message}</FormMessage>
                          </FormItem>
                        </div>
                        <div className="p-3 border rounded-md space-y-4">
                          <h4 className="font-medium text-sm flex items-center"><Text className="mr-2 h-4 w-4 text-primary"/> Slide Text</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField control={form.control} name={`media.${index}.headline`} render={({ field }) => (
                                  <FormItem><FormLabel>Headline</FormLabel><FormControl><Input placeholder="E.g. Special Offer!" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                              )}/>
                               <FormField control={form.control} name={`media.${index}.subheadline`} render={({ field }) => (
                                  <FormItem><FormLabel>Subheadline</FormLabel><FormControl><Input placeholder="E.g. 50% off on all pizzas." {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>
                              )}/>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField control={form.control} name={`media.${index}.textPosition`} render={({ field }) => (
                                <FormItem><FormLabel><MoveVertical className="inline mr-1 h-4"/> Position</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{['top-left', 'top-center', 'top-right', 'center-left', 'center-center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                            )}/>
                             <FormField control={form.control} name={`media.${index}.fontSize`} render={({ field }) => (
                                <FormItem><FormLabel><Text className="inline mr-1 h-4"/> Size</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{['sm', 'md', 'lg', 'xl'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name={`media.${index}.fontFamily`} render={({ field }) => (
                                <FormItem><FormLabel>Font</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{['sans', 'serif', 'headline'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
                            )}/>
                          </div>
                        </div>
                         <div className="p-3 border rounded-md space-y-4">
                            <h4 className="font-medium text-sm flex items-center"><Link2 className="mr-2 h-4 w-4 text-primary"/> Slide Link</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                <FormField control={form.control} name={`media.${index}.linkType`} render={({ field }) => (
                                    <FormItem><FormLabel>Link To</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="menu">Menu Page</SelectItem><SelectItem value="categories">Categories Page</SelectItem><SelectItem value="item">Menu Item</SelectItem><SelectItem value="category">Specific Category</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                {['item', 'category'].includes(form.watch(`media.${index}.linkType`) || 'none') && (
                                     <FormField control={form.control} name={`media.${index}.linkValue`} render={({ field }) => (
                                        <FormItem><FormLabel>Select {form.watch(`media.${index}.linkType`)}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger></FormControl><SelectContent>
                                        {form.watch(`media.${index}.linkType`) === 'item' && menuItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                        {form.watch(`media.${index}.linkType`) === 'category' && categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                                        </SelectContent></Select><FormMessage /></FormItem>
                                    )}/>
                                )}
                            </div>
                        </div>
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteMedia(index)} className="mt-7">
                        <Trash2 className="h-4 w-4" /><span className="sr-only">Remove slide</span>
                      </Button>
                    </div>
                    {mediaFiles[index]?.preview && (
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel>Preview</FormLabel>
                          {mediaFiles[index].type === 'video' ? (<Badge variant="secondary"><Video className="mr-1.5 h-3 w-3" /> Video</Badge>) : (<Badge variant="secondary"><ImageIcon className="mr-1.5 h-3 w-3" /> Image</Badge>)}
                        </div>
                        <div className="mt-2 p-2 border rounded-md flex justify-center items-center bg-muted/50 aspect-[16/9]">
                          {mediaFiles[index].type === 'video' ? (<video src={mediaFiles[index].preview} className="rounded-md object-cover h-full w-full" controls />) : (<Image src={mediaFiles[index].preview} alt={`Preview ${index + 1}`} width={1280} height={720} className="rounded-md object-cover h-full w-full" />)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={handleAddSlide}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Slide
              </Button>
              <FormMessage>{form.formState.errors.media?.message || form.formState.errors.media?.root?.message}</FormMessage>
            </CardContent>
          </Card>
        </form>
      </Form>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this slide from the homepage.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMediaIndexToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete Slide</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
