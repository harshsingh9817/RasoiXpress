
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { SupportTicket } from "@/lib/types";
import { getSupportTickets, resolveSupportTicket } from "@/lib/data";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, LifeBuoy, CheckCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SupportPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const allTickets = await getSupportTickets();
      setTickets(allTickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      toast({ title: "Error", description: "Could not fetch support tickets.", variant: "destructive" });
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
      loadTickets();
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router, loadTickets]);

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await resolveSupportTicket(ticketId);
      toast({
        title: "Ticket Resolved",
        description: `Ticket #${ticketId.slice(-6)} has been marked as resolved.`,
      });
      await loadTickets();
    } catch (error) {
      console.error("Failed to resolve ticket:", error);
      toast({
        title: "Update Failed",
        description: "Could not update the ticket status.",
        variant: "destructive",
      });
    }
  };
  
  const getStatusVariant = (status: SupportTicket['status']): "default" | "secondary" => {
    return status === 'Resolved' ? 'default' : 'secondary';
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isAuthLoading ? "Verifying access..." : "Loading tickets..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <LifeBuoy className="mr-3 h-6 w-6 text-primary" /> Support Tickets
          </CardTitle>
          <CardDescription>
            View and manage support requests from users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead className="max-w-[400px]">Message</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                        <p className="font-medium">{ticket.userName || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
                    </TableCell>
                    <TableCell className="max-w-[400px] whitespace-pre-wrap break-words">{ticket.message}</TableCell>
                    <TableCell>{new Date(ticket.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {ticket.status === 'Open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveTicket(ticket.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Resolved
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    No support tickets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
