
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  imageUrl: string;
  categories: string[];
  menu: MenuItem[];
  address: string;
  promotions?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isVegetarian?: boolean;
  isPopular?: boolean;
  weight?: string; // e.g., "250g", "Approx. 300g"
  ingredients?: string; // e.g., "Flour, Tomato, Cheese, Basil" or comma-separated
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Review {
  rating: number;
  comment?: string;
  date: string;
}

export interface Order {
  id: string;
  userId: string; // Added to associate order with a user
  userEmail: string; // Added for display on delivery dashboard
  date: string;
  status: OrderStatus;
  total: number; // This is the grand total
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: 'UPI' | 'Cash on Delivery';
  cancellationReason?: string;
  review?: Review; // Added for review
  // The 'total' field should represent the final amount paid by the customer, including taxes and delivery.
  // We can calculate subtotal, taxes, and delivery fee on the fly for display if needed.
}

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  street: string;
  city: string;
  pinCode: string; // Changed from postalCode
  phone: string; // Added
  alternatePhone?: string; // Added
  isDefault: boolean;
}

export interface GeocodedLocation {
  city?: string;
  locality?: string;
  fullAddress?: string;
  error?: string;
  lat?: number;
  lng?: number;
}

export interface AppNotification {
  id: string; // Unique key e.g., 'notif-ORD123-Delivered' or 'notif-rec-dishname'
  timestamp: number;
  title: string;
  message: string;
  read: boolean;
  type: 'new_dish' | 'order_update';
  link?: string;
  orderId?: string;
}

    