

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
  costPrice?: number;
  imageUrl: string;
  category: string;
  isVegetarian?: boolean;
  isPopular?: boolean;
  isVisible?: boolean; // Added for visibility control
  weight?: string; // e.g., "250g", "Approx. 300g"
  ingredients?: string; // e.g., "Flour, Tomato, Cheese, Basil" or comma-separated
  taxRate?: number; // e.g., 0.05 for 5% tax
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Accepted by Rider'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Expired';

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
  user_id: string;
  supabase_order_uuid?: string; // Added to store the Supabase UUID
  userEmail: string; 
  customerName: string; 
  date: string;
  status: OrderStatus;
  total: number; // This is the grand total
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: 'Razorpay' | 'Cash on Delivery';
  cancellationReason?: string;
  review?: Review; 
  customerPhone?: string;
  deliveryConfirmationCode?: string;
  deliveryFee: number;
  taxRate?: number; 
  totalTax: number; 
  deliveryRiderId?: string;
  deliveryRiderName?: string;
  deliveryRiderPhone?: string;
  deliveryRiderVehicle?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  isAvailableForPickup?: boolean;
  shippingLat?: number;
  shippingLng?: number;
  couponCode?: string;
  discountAmount?: number;
}

export interface Address {
  id: string;
  fullName: string;
  type: 'Home' | 'Work' | 'Other';
  street: string;
  village?: string;
  city: string;
  pinCode: string; 
  phone: string; 
  alternatePhone?: string; 
  isDefault: boolean;
  lat: number;
  lng: number;
}

export interface AppNotification {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  read: boolean;
  type: 'order_update' | 'admin_message' | 'admin_new_order' | 'admin_order_delivered' | 'admin_new_support_ticket';
  link?: string;
  orderId?: string;
  orderStatus?: OrderStatus;
}

export interface BannerImage {
  src: string;
  hint: string;
  order: number;
}

export interface HeroData {
  headline: string;
  subheadline: string;
  orderingTime: string;
  bannerImages: BannerImage[];
  headlineColor?: string;
  subheadlineColor?: string;
}

export interface PaymentSettings {
  upiId: string;
  qrCodeImageUrl: string;
  isRazorpayEnabled: boolean;
  isDeliveryFeeEnabled: boolean;
  mapApiUrl: string;
  deliveryRadiusKm?: number;
  orderExpirationMinutes?: number;
}

export interface DailyChartData {
  date: string;
  revenue: number;
  profit: number;
  loss: number;
}

export interface AnalyticsData {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    totalLoss: number;
    totalCancelledOrders: number;
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

export interface Coupon {
    id: string;
    code: string;
    discountPercent: number;
    status: 'active' | 'inactive';
    createdAt: any; 
    validFrom: any; 
    validUntil: any; 
}
