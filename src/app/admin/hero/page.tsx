
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getHeroData, updateHeroData } from "@/lib/data";
import type { HeroData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LayoutTemplate, Save, PlusCircle, Trash2 } from "lucide-react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const bannerSchema = z.object({
  src: z.string().url("Please enter a valid image URL."),
  hint: z.string().min(1, "AI hint is required (e.g., 'pizza meal')."),
});

const heroSchema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters long."),
  subheadline: z.string().min(10, "Subheadline must be at least 10 characters long."),
  orderingTime: z.string().min(1, "Ordering time must be set."),
  bannerImages: z.array(bannerSchema).min(1, "You must have at least one banner image."),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
});

type HeroFormValues = z.infer<typeof heroSchema>;

export default function HeroManagementPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("10:00 PM");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bannerIndexToDelete, setBannerIndexToDelete] = useState<number | null>(null);

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      headline: "",
      subheadline: "",
      orderingTime: "10:00 AM - 10:00 PM",
      bannerImages: [],
      headlineColor: "#FFFFFF",
      subheadlineColor: "#E5E7EB",
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bannerImages",
  });
  
  const watchedBanners = form.watch("bannerImages");

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const loadData = async () => {
        const data = await getHeroData();
        form.reset({
            ...data,
            headlineColor: data.headlineColor || '#FFFFFF',
            subheadlineColor: data.subheadlineColor || '#E5E7EB',
        });
        if (data.orderingTime && data.orderingTime.includes(' - ')) {
            const [start, end] = data.orderingTime.split(' - ');
            setStartTime(start.trim());
            setEndTime(end.trim());
        }
      }
      loadData();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, form]);

  useEffect(() => {
    form.setValue('orderingTime', `${startTime} - ${endTime}`, { shouldValidate: true });
  }, [startTime, endTime, form]);

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const totalMinutes = i * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  });

  const onSubmit = async (data: HeroFormValues) => {
    setIsSubmitting(true);
    try {
      await updateHeroData(data);
      toast({
        title: "Hero Section Updated",
        description: "The homepage hero has been successfully updated.",
      });
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

  const handleDeleteBanner = (index: number) => {
    setBannerIndexToDelete(index);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bannerIndexToDelete !== null) {
        remove(bannerIndexToDelete);
        toast({
            title: "Banner Removed",
            description: "The banner has been removed. Click 'Save All Changes' to make it permanent.",
        });
    }
    setIsDeleteDialogOpen(false);
    setBannerIndexToDelete(null);
  };

  if (isAuthLoading || (!isAuthenticated && !isAuthLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-2xl font-headline flex items-center">
                            <LayoutTemplate className="mr-3 h-6 w-6 text-primary" /> Edit Homepage Hero
                        </CardTitle>
                        <CardDescription>
                            Update the text and rotating banner images displayed on the homepage.
                            <p className="mt-1">
                            Search image on <a href="https://unsplash.com/search/photos/food" target="_blank" rel="noopener noreferrer" className="text-primary underline">UNSPLASH website</a>.
                            </p>
                        </CardDescription>
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="shrink-0">
                        {isSubmitting ? (
                          <>
                            <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" /> Save All Changes
                          </>
                        )}
                      </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Headline</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter the main headline" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subheadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subheadline</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter the supporting text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="headlineColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Headline Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                type="text"
                                placeholder="#FFFFFF"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subheadlineColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subheadline Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                               <Input
                                type="color"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                type="text"
                                placeholder="#E5E7EB"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Ordering Time</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Opening Time</p>
                            <Select value={startTime} onValueChange={setStartTime}>
                                <SelectTrigger>
                                <SelectValue placeholder="Start time" />
                                </SelectTrigger>
                                <SelectContent>
                                {timeSlots.map(time => (
                                    <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Closing Time</p>
                            <Select value={endTime} onValueChange={setEndTime}>
                                <SelectTrigger>
                                <SelectValue placeholder="End time" />
                                </SelectTrigger>
                                <SelectContent>
                                {timeSlots.map(time => (
                                    <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <FormMessage>{form.formState.errors.orderingTime?.message}</FormMessage>
                  </div>
                  
                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium">Manage Banners</h3>
                    <p className="text-sm text-muted-foreground">Add or remove banner images for the homepage carousel.</p>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-lg">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-2">
                               <FormField
                                control={form.control}
                                name={`bannerImages.${index}.src`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Image URL</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://placehold.co/1280x400.png" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                               <FormField
                                control={form.control}
                                name={`bannerImages.${index}.hint`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>AI Hint</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., pizza meal" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteBanner(index)} className="mt-7">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove banner</span>
                            </Button>
                        </div>
                        {watchedBanners?.[index]?.src && (
                            <div className="w-full">
                                <FormLabel>Banner Preview</FormLabel>
                                <div className="mt-2 p-2 border rounded-md flex justify-center items-center bg-muted/50 aspect-[16/6]">
                                    <Image
                                        src={watchedBanners[index].src}
                                        alt={`Banner Preview ${index + 1}`}
                                        width={1280}
                                        height={400}
                                        className="rounded-md object-cover h-full w-full"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/1280x400.png?text=Invalid+URL';
                                        }}
                                        data-ai-hint={watchedBanners[index].hint || 'banner'}
                                    />
                                </div>
                            </div>
                        )}
                      </div>
                    ))}
                  </div>

                   <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ src: 'https://placehold.co/1280x400.png', hint: 'new banner' })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Banner
                    </Button>
                    <FormMessage>{form.formState.errors.bannerImages?.message}</FormMessage>

                </CardContent>
            </form>
        </Form>
      </Card>
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this banner image from the homepage.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBannerIndexToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete Banner
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
