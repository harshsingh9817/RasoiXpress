
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import { LayoutTemplate, Loader2, Save } from "lucide-react";

const heroSchema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters long."),
  subheadline: z.string().min(10, "Subheadline must be at least 10 characters long."),
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
    },
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
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <LayoutTemplate className="mr-3 h-6 w-6 text-primary" /> Edit Homepage Hero
          </CardTitle>
          <CardDescription>
            Update the main headline and subheadline displayed on the homepage banner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
