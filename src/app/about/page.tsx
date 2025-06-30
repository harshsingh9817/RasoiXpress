
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AboutUsPage() {
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
          <CardTitle className="text-3xl font-headline">About Rasoi Xpress</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-4">
          <p>
            Welcome to Rasoi Xpress, your number one source for delicious, fast food delivered right to your door. We're dedicated to giving you the very best of local cuisine, with a focus on quality, speed, and customer service.
          </p>
          <p>
            Founded in 2024 by Harsh Singh, Rasoi Xpress has come a long way from its beginnings. When we first started out, our passion for providing great food quickly drove us to start our own business.
          </p>
          <p>
            We now serve customers all over Nagra, and are thrilled that we're able to turn our passion into our own website. We hope you enjoy our products as much as we enjoy offering them to you. If you have any questions or comments, please don't hesitate to contact us.
          </p>
          <p>Sincerely,</p>
          <p>The Rasoi Xpress Team</p>
        </CardContent>
      </Card>
    </div>
  );
}
