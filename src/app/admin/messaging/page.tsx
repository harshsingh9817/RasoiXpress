
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAllUsers, sendAdminMessage } from "@/lib/data";
import type { UserRef } from "@/lib/types";
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
import { MessageSquare, Send, Users, User, Check, ChevronsUpDown, Link2 } from "lucide-react";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";


const messageSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(50, "Title cannot exceed 50 characters."),
  message: z.string().min(10, "Message must be at least 10 characters.").max(500, "Message cannot exceed 500 characters."),
  link: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});
type MessageFormValues = z.infer<typeof messageSchema>;

const individualMessageSchema = messageSchema.extend({
    userId: z.string({ required_error: "Please select a user." }),
});
type IndividualMessageFormValues = z.infer<typeof individualMessageSchema>;

export default function MessagingPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRef[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const broadcastForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { title: "", message: "", link: "" },
  });

  const individualForm = useForm<IndividualMessageFormValues>({
    resolver: zodResolver(individualMessageSchema),
    defaultValues: { title: "", message: "", link: "" },
  });

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const loadUsers = async () => {
        setIsDataLoading(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers);
        } catch (error) {
            toast({ title: "Error", description: "Could not load users.", variant: "destructive" });
        } finally {
            setIsDataLoading(false);
        }
      }
      loadUsers();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, toast]);

  const onBroadcastSubmit = async (data: MessageFormValues) => {
    setIsSubmitting(true);
    try {
      const allPromises = users.map(user => 
          sendAdminMessage(user.id, user.email, data.title, data.message, data.link)
      );
      await Promise.all(allPromises);
      toast({
        title: "Message Broadcast!",
        description: `Your message has been sent to all ${users.length} users.`,
      });
      broadcastForm.reset();
    } catch (error) {
      handleSendError(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onIndividualSubmit = async (data: IndividualMessageFormValues) => {
    setIsSubmitting(true);
    const targetUser = users.find(u => u.id === data.userId);
    if (!targetUser) {
        toast({ title: "User not found", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        await sendAdminMessage(targetUser.id, targetUser.email, data.title, data.message, data.link);
        toast({
            title: "Message Sent!",
            description: `Your message has been sent to ${targetUser.email}.`,
        });
        individualForm.reset();
    } catch (error) {
        handleSendError(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSendError = (error: any) => {
     console.error("Failed to send message(s)", error);
      toast({
        title: "Failed to Send",
        description: "An error occurred while sending the message(s).",
        variant: "destructive",
      });
  }

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Verifying access..." : "Loading users..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <MessageSquare className="mr-3 h-6 w-6 text-primary" /> Send a Notification
          </CardTitle>
          <CardDescription>
            Send a notification for announcements, offers, or direct communication. Add an optional link to redirect users.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="broadcast" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="broadcast"><Users className="mr-2 h-4 w-4" />Broadcast to All</TabsTrigger>
                    <TabsTrigger value="individual"><User className="mr-2 h-4 w-4" />Send to Individual</TabsTrigger>
                </TabsList>
                <TabsContent value="broadcast" className="pt-4">
                     <Form {...broadcastForm}>
                        <form onSubmit={broadcastForm.handleSubmit(onBroadcastSubmit)} className="space-y-6">
                           <FormField control={broadcastForm.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Broadcast Title</FormLabel><FormControl><Input placeholder="E.g., Special Offer Just For You!" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={broadcastForm.control} name="message" render={({ field }) => (
                                <FormItem><FormLabel>Broadcast Message</FormLabel><FormControl><Textarea placeholder="Enter the full message content here..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={broadcastForm.control} name="link" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center"><Link2 className="mr-2 h-4 w-4"/>Link (Optional)</FormLabel><FormControl><Input placeholder="e.g., /categories/Pizza" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={isSubmitting || users.length === 0} className="w-full">
                                {isSubmitting ? (<><div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> Sending...</>) : (<><Send className="mr-2 h-4 w-4" /> Send to All Users ({users.length})</>)}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="individual" className="pt-4">
                    <Form {...individualForm}>
                        <form onSubmit={individualForm.handleSubmit(onIndividualSubmit)} className="space-y-6">
                             <FormField
                                control={individualForm.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Select User</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? users.find((user) => user.id === field.value)?.email : "Select a user..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search user..." />
                                                <CommandList>
                                                    <CommandEmpty>No user found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {users.map((user) => (
                                                        <CommandItem
                                                            value={user.email}
                                                            key={user.id}
                                                            onSelect={() => { individualForm.setValue("userId", user.id) }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", user.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {user.email}
                                                        </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                           <FormField control={individualForm.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Message Title</FormLabel><FormControl><Input placeholder="E.g., Regarding your recent order" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={individualForm.control} name="message" render={({ field }) => (
                                <FormItem><FormLabel>Message Content</FormLabel><FormControl><Textarea placeholder="Enter the personal message content here..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={individualForm.control} name="link" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center"><Link2 className="mr-2 h-4 w-4"/>Link (Optional)</FormLabel><FormControl><Input placeholder="e.g., /my-orders?track=..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? (<><div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> Sending...</>) : (<><Send className="mr-2 h-4 w-4" /> Send Direct Message</>)}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    
