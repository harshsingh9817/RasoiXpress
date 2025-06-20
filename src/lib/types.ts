
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

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  total: number; // This is the grand total
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: 'UPI' | 'Cash on Delivery';
  cancellationReason?: string; // Added for cancellation reason
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
