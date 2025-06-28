
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send } from "lucide-react";
import AnimatedFoodPackingAndLoading from "@/components/icons/AnimatedFoodPackingAndLoading";
import AnimatedDeliveryScooter from "@/components/icons/AnimatedDeliveryScooter";

const ALL_USERS_VALUE = "--all-users--";

const messageSchema = z.object({
  userId: z.string().min(1, "Please select a user or 'All Users'."),
  title: z.string().min(5, "Title must be at least 5 characters.").max(50, "Title cannot exceed 50 characters."),
  message: z.string().min(10, "Message must be at least 10 characters.").max(500, "Message cannot exceed 500 characters."),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function MessagingPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRef[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      userId: "",
      title: "",
      message: "",
    },
  });

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
      return;
    }
    if (isAuthenticated && isAdmin) {
      const loadUsers = async () => {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      }
      loadUsers();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router]);

  const onSubmit = async (data: MessageFormValues) => {
    setIsSubmitting(true);
    try {
      if (data.userId === ALL_USERS_VALUE) {
        // Broadcast to all users
        const allPromises = users.map(user => 
            sendAdminMessage(user.id, user.email, data.title, data.message)
        );
        await Promise.all(allPromises);
        toast({
          title: "Message Broadcast!",
          description: `Your message has been sent to all ${users.length} users.`,
        });

      } else {
        // Send to a single user
        const selectedUser = users.find(u => u.id === data.userId);
        if (!selectedUser) {
          toast({ title: "User not found", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        await sendAdminMessage(selectedUser.id, selectedUser.email, data.title, data.message);
        toast({
          title: "Message Sent!",
          description: `Your message has been sent to ${selectedUser.email}.`,
        });
      }
      
      form.reset({ userId: '', title: '', message: '' });
    } catch (error) {
      console.error("Failed to send message(s)", error);
      toast({
        title: "Failed to Send",
        description: "An error occurred while sending the message(s).",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || (!isAuthenticated && !isAuthLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-40 h-40 text-primary">
            <AnimatedFoodPackingAndLoading />
        </div>
        <p className="text-xl text-muted-foreground">Verifying access...</p>
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
            Send a direct notification to a specific user or broadcast a message to all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user to message" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ALL_USERS_VALUE}>All Users</SelectItem>
                        {users.length > 0 ? (
                          users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.email}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-users" disabled>No users found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Special Offer Just For You!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the full message content here..."
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <div className="w-12 h-8 mr-2"><AnimatedDeliveryScooter /></div> Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Message
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
