
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RefundAndCancellationPage() {
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
          <CardTitle className="text-3xl font-headline">Refund & Cancellation Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
          <h2 className="text-xl font-semibold">Cancellation Policy</h2>
          <p>
            You can cancel your order within 5 minutes of placing it directly through the
            "My Orders" page. After this period, cancellations may not be possible as the
            restaurant may have started preparing your food.
          </p>
          <h2 className="text-xl font-semibold">Refund Policy</h2>
          <p>
            For prepaid orders, if your cancellation is successful within the stipulated
            time, the refund will be processed to your original payment method within 5-7
            business days. For issues with food quality or incorrect items, please contact
            our support team within 2 hours of delivery for assistance. Refunds in such
            cases are subject to verification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
