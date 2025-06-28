
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { SupportTicket } from "@/lib/types";
import { getSupportTickets, resolveSupportTicket, replyToSupportTicket } from "@/lib/data";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, CheckCircle, Mail, Send, CornerUpLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";

export default function SupportPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [ticketToReply, setTicketToReply] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

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

  const handleOpenReplyDialog = (ticket: SupportTicket) => {
    setTicketToReply(ticket);
    setReplyMessage("");
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!ticketToReply || !ticketToReply.userId || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
        await replyToSupportTicket(ticketToReply.id, ticketToReply.userId, ticketToReply.userEmail, replyMessage);
        toast({ title: "Reply Sent!", description: `Your reply has been sent to ${ticketToReply.userEmail}.` });
        setIsReplyDialogOpen(false);
        await loadTickets(); // Refresh tickets
    } catch (error) {
        console.error("Failed to send reply:", error);
        toast({ title: "Failed to Send Reply", variant: "destructive" });
    } finally {
        setIsSendingReply(false);
    }
  };

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
  
  const getStatusVariant = (status: SupportTicket['status']): "default" | "secondary" | "destructive" => {
    switch(status) {
        case 'Resolved': return 'default';
        case 'Open': return 'destructive';
        case 'Replied': return 'secondary';
        default: return 'secondary';
    }
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
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
                <TableHead className="max-w-[300px]">Message</TableHead>
                <TableHead className="max-w-[300px]">Admin Reply</TableHead>
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
                    <TableCell className="max-w-[300px] whitespace-pre-wrap break-words">{ticket.message}</TableCell>
                    <TableCell className="max-w-[300px] whitespace-pre-wrap break-words text-muted-foreground italic">
                        {ticket.reply ? `"${ticket.reply}"` : "No reply yet"}
                    </TableCell>
                    <TableCell>{new Date(ticket.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {ticket.status !== 'Resolved' && (
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReplyDialog(ticket)}
                                disabled={!ticket.userId}
                                title={!ticket.userId ? "Cannot reply to guest messages" : "Send a reply"}
                             >
                               <CornerUpLeft className="mr-2 h-4 w-4" />
                               Reply
                             </Button>
                        )}
                      {ticket.status !== 'Resolved' && (
                        <Button
                          variant="default"
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    No support tickets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reply to {ticketToReply?.userName}</DialogTitle>
                <DialogDescription>Your reply will be sent as a notification to the user.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea 
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={6}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSendingReply}>Cancel</Button></DialogClose>
                <Button onClick={handleSendReply} disabled={isSendingReply || !replyMessage.trim()}>
                    {isSendingReply ? <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> : <Send className="mr-2 h-4 w-4"/>}
                    {isSendingReply ? 'Sending...' : 'Send Reply'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
