
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ContactUsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/" className="inline-block">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            We'd love to hear from you! Whether you have a question about our menu, your order, or anything else, our team is ready to answer all your questions.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 text-center">
                <Mail className="h-6 w-6 text-primary inline-block" />
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-muted-foreground">For general inquiries, support, and feedback.</p>
                <a href="mailto:harshsingh9817@gmail.com" className="text-primary hover:underline">harshsingh9817@gmail.com</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 text-center">
                <Phone className="h-6 w-6 text-primary inline-block" />
              </div>
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p className="text-muted-foreground">For urgent matters regarding your order.</p>
                <a href="tel:+919335958817" className="text-primary hover:underline">+91 93359 58817</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 text-center">
                <MapPin className="h-6 w-6 text-primary inline-block" />
              </div>
              <div>
                <h3 className="font-semibold">Address</h3>
                <p className="text-muted-foreground">
                  Rasoi Xpress<br />
                  Hanuman Mandir, Ghosi More<br />
                  Nagra, Ballia, Uttar Pradesh 221711
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
