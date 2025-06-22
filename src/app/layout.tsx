
import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Rasoi Xpress - Fast Food Delivery',
  description: 'Order your favorite food online with Rasoi Xpress from the best restaurants near you.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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
