
import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'NibbleNow - Fast Food Delivery',
  description: 'Order your favorite food online from the best restaurants near you.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider> {/* Wrap with AuthProvider */}
          <CartProvider>
            <Header />
            <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
