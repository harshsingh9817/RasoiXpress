


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

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

export interface MenuItem {
  id:string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  imageUrl: string;
  category: string;
  isVegetarian?: boolean;
  isPopular?: boolean;
  isVisible?: boolean;
  weight?: string;
  ingredients?: string;
  taxRate?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type OrderStatus =
  | 'Payment Pending'
  | 'Order Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Accepted by Rider'
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
  userId: string;
  supabase_order_uuid?: string;
  userEmail: string; 
  customerName: string; 
  date: string;
  status: OrderStatus;
  total: number;
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
  couponCode?: string | null;
  discountAmount?: number;
  createdAt?: any;
}

export interface Address {
  id: string;
  fullName: string;
  type: 'Home' | 'Work' | 'Other';
  street: string;
  village?: string;
  city: string;
  state: string;
  pinCode: string; 
  phone: string; 
  alternatePhone?: string; 
  isDefault: boolean;
  lat: number;
  lng: number;
}

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
}

export interface AppNotification {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  read: boolean;
  type: 'order_update' | 'admin_message' | 'admin_new_order' | 'admin_order_delivered' | 'admin_new_support_ticket' | 'delivery_available';
  link?: string;
  orderId?: string;
  orderStatus?: OrderStatus;
}

export interface HeroMedia {
  type: 'image' | 'video';
  src: string;
  order: number;
  headline?: string;
  subheadline?: string;
  linkType?: 'none' | 'item' | 'category' | 'menu' | 'categories' | 'custom';
  linkValue?: string;
  textPosition?: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-center' | 'center-right' | 'top-left' | 'top-center' | 'top-right';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: 'sans' | 'serif' | 'headline';
}

export interface HeroData {
  media: HeroMedia[];
  slideInterval: number;
}

export interface PaymentSettings {
  isRazorpayEnabled: boolean;
  isDeliveryFeeEnabled: boolean;
  fixedDeliveryFee?: number;
  orderExpirationMinutes?: number;
  merchantName?: string;
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
  type: 'broadcast' | 'individual';
  userId?: string;
  userEmail?: string;
  title: string;
  message: string;
  timestamp: number;
  link?: string;
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

export interface listenToCategories {
    id: string;
    name: string;
    imageUrl: string;
}

export interface RestaurantTime {
  openTime: string;
  closeTime: string;
}

    