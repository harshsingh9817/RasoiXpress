
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/checkout" className="inline-block">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Checkout
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
          <p>
            This Privacy Policy describes how Rasoi Xpress ("we", "us", or "our") collects,
            uses, and discloses your personal information when you use our services.
          </p>
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p>
            We may collect personal information that you provide to us, such as your name,
            email address, phone number, and shipping address. We also collect information
            about your orders and payment details necessary to process your transactions.
          </p>
          <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to process your orders, communicate with you,
            improve our services, and comply with legal obligations.
          </p>
          <h2 className="text-xl font-semibold">3. Data Security</h2>
          <p>
            We take reasonable measures to protect your personal information from
            unauthorized access, use, or disclosure. However, no method of transmission
            over the internet is 100% secure.
          </p>
          <h2 className="text-xl font-semibold">4. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
