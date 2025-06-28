
"use client";

import { useEffect, useState } from "react";
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

const bannerSchema = z.object({
  src: z.string().url("Please enter a valid image URL."),
  hint: z.string().min(1, "AI hint is required (e.g., 'pizza meal')."),
});

const heroSchema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters long."),
  subheadline: z.string().min(10, "Subheadline must be at least 10 characters long."),
  bannerImages: z.array(bannerSchema).min(1, "You must have at least one banner image."),
});

type HeroFormValues = z.infer<typeof heroSchema>;

export default function HeroManagementPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      headline: "",
      subheadline: "",
      bannerImages: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bannerImages",
  });

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const loadData = async () => {
        const data = await getHeroData();
        form.reset(data);
      }
      loadData();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, form]);

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
                  <CardTitle className="text-2xl font-headline flex items-center">
                    <LayoutTemplate className="mr-3 h-6 w-6 text-primary" /> Edit Homepage Hero
                  </CardTitle>
                  <CardDescription>
                    Update the text and rotating banner images displayed on the homepage.
                  </CardDescription>
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
                  
                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium">Manage Banners</h3>
                    <p className="text-sm text-muted-foreground">Add or remove banner images for the homepage carousel.</p>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg">
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
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="mt-7">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove banner</span>
                        </Button>
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

                <CardContent>
                  <Button type="submit" disabled={isSubmitting}>
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
              </CardContent>
            </form>
        </Form>
      </Card>
    </div>
  );
}
