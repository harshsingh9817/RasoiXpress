
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
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
          <CardTitle className="text-3xl font-headline">Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Rasoi Xpress, you agree to be bound by these Terms and
            Conditions. If you do not agree with any part of these terms, you must not use
            our services.
          </p>
          <h2 className="text-xl font-semibold">2. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and
            password. You agree to accept responsibility for all activities that occur
            under your account.
          </p>
          <h2 className="text-xl font-semibold">3. Orders and Payments</h2>
          <p>
            All orders placed through our platform are subject to confirmation and
            acceptance by us. We reserve the right to refuse or cancel an order for any
            reason. All payments must be made through the available payment methods.
          </p>
          <h2 className="text-xl font-semibold">4. Limitation of Liability</h2>
          <p>
            Rasoi Xpress will not be liable for any indirect, incidental, special, or
            consequential damages arising out of or in connection with our services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
