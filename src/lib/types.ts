

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
  originalPrice?: number; // The new field for the original price before discount
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
  supabase_order_uuid?: string; // Added to store the Supabase UUID
  userEmail: string; 
  customerName: string; 
  date: string;
  status: OrderStatus;
  total: number; // This is the grand total
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: 'Razorpay';
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
}

export interface Address {
  id: string;
  fullName: string;
  type: 'Home' | 'Work' | 'Other';
  street: string; // House No, Building Name and Road Name/Area
  village?: string; // Village, Landmark
  city: string;
  state: string;
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
  linkType?: 'none' | 'item' | 'category' | 'menu' | 'categories';
  linkValue?: string; // Holds menu item ID or category name
  textPosition?: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-center' | 'center-right' | 'top-left' | 'top-center' | 'top-right';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: 'sans' | 'serif' | 'headline';
}

export interface HeroData {
  media: HeroMedia[];
  slideInterval: number; // in seconds
  orderingTime?: string; // e.g., '10:00 AM - 10:00 PM'
}

export interface PaymentSettings {
  isRazorpayEnabled: boolean;
  isDeliveryFeeEnabled: boolean;
  deliveryRadiusKm?: number;
  orderExpirationMinutes?: number;
  mapApiUrl: string;
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
