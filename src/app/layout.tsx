
import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google'; // Import PT Sans
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import CartSheet from '@/components/CartSheet';

// Configure the font
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'], // Include weights you need
  variable: '--font-pt-sans', // CSS variable for tailwind
});

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
      <body className={`${ptSans.variable} font-body antialiased`}>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
            <Toaster />
            <CartSheet />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
