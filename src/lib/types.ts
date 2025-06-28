
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
  id:string;
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
  customerName: string; // Added for displaying customer name
  date: string;
  status: OrderStatus;
  total: number; // This is the grand total
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: 'UPI' | 'Cash on Delivery';
  cancellationReason?: string;
  review?: Review; // Added for review
  customerPhone?: string;
  deliveryConfirmationCode?: string;
  deliveryFee: number;
  taxRate: number;
}

export interface Address {
  id: string;
  fullName: string;
  type: 'Home' | 'Work' | 'Other';
  street: string;
  village?: string;
  city: string;
  pinCode: string; // Changed from postalCode
  phone: string; // Added
  alternatePhone?: string; // Added
  isDefault: boolean;
}

export interface AppNotification {
  id: string; // Unique key e.g., 'notif-ORD123-Delivered' or 'notif-rec-dishname'
  timestamp: number;
  title: string;
  message: string;
  read: boolean;
  type: 'order_update' | 'admin_message' | 'admin_new_order' | 'admin_order_delivered' | 'delivery_assignment';
  link?: string;
  orderId?: string;
  orderStatus?: OrderStatus;
}

export interface BannerImage {
  src: string;
  hint: string;
}

export interface HeroData {
  headline: string;
  subheadline: string;
  bannerImages: BannerImage[];
}

export interface PaymentSettings {
  upiId: string;
  qrCodeImageUrl: string;
  deliveryFee: number;
  taxRate: number; // e.g., 0.05 for 5%
}

export interface DailyChartData {
  date: string;
  revenue: number;
  profit: number;
}

export interface AnalyticsData {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    chartData: DailyChartData[];
}

export interface AdminMessage {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  message: string;
  timestamp: number;
}

export interface UserRef {
  id: string;
  email: string;
}

export interface Rider {
  id: string;
  fullName: string;
  email: string;
}

export interface SupportTicket {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  message: string;
  timestamp: any;
  status: 'Open' | 'Replied' | 'Resolved';
  reply?: string;
  repliedAt?: any;
}
