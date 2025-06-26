
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Mail } from 'lucide-react';
import { sendSupportMessage } from '@/lib/data';

interface HelpDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user?.email && isOpen) {
      setEmail(user.email);
    }
    if (!isOpen) { // Reset message when dialog closes
        setMessage('');
    }
  }, [user, isOpen]);

  const validateEmail = (emailToValidate: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !validateEmail(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    if (!message.trim()) {
      toast({
        title: 'Empty Message',
        description: 'Please enter your message or query.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
        await sendSupportMessage({
            userEmail: email,
            userId: user?.uid,
            userName: user?.displayName || 'Guest',
            message: message,
        });

        toast({
          title: 'Message Sent!',
          description: "We've received your query and will get back to you soon.",
        });
        setIsSending(false);
        onOpenChange(false); // Close dialog
    } catch (error) {
        console.error("Failed to send support message:", error);
        toast({
            title: 'Failed to Send',
            description: "An error occurred while sending your message.",
            variant: "destructive",
        });
        setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-primary" /> Contact Support
          </DialogTitle>
          <DialogDescription>
            Have a question or need help? Fill out the form below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSendMessage}>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="help-email">Your Email</Label>
              <Input
                id="help-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!user?.email} // Disable if logged in and email is pre-filled
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="help-message">Your Message</Label>
              <Textarea
                id="help-message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
