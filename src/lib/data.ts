
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  onSnapshot,
  deleteField,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { supabase } from './supabase';
import type { Restaurant, MenuItem, Order, Address, Review, HeroData, PaymentSettings, AnalyticsData, DailyChartData, AdminMessage, UserRef, SupportTicket, BannerImage, Coupon, OrderStatus } from './types';


// --- Initial Data ---
const initialMenuItems: Omit<MenuItem, 'id'>[] = [];

const defaultBanners: BannerImage[] = [
    { src: 'https://placehold.co/1280x400.png', hint: 'pizza meal', order: 1 },
    { src: 'https://placehold.co/1280x400.png', hint: 'indian thali', order: 2 },
    { src: 'https://placehold.co/1280x400.png', hint: 'burger fries', order: 3 },
    { src: 'https://placehold.co/1280x400.png', hint: 'chinese noodles', order: 4 },
];

const defaultHeroData: HeroData = {
    headline: 'Home Delivery In Nagra With Rasoi Xpress',
    subheadline: 'Browse our menu of curated dishes and get your favorites delivered to your door.',
    orderingTime: '10:00 AM - 10:00 PM',
    bannerImages: defaultBanners,
    headlineColor: "#FFFFFF",
    subheadlineColor: "#E5E7EB"
};

const defaultPaymentSettings: PaymentSettings = {
    upiId: 'rasoixpress@okbank',
    qrCodeImageUrl: 'https://placehold.co/250x250.png?text=Scan+to+Pay',
    isRazorpayEnabled: true,
    isDeliveryFeeEnabled: true,
    mapApiUrl: 'https://maps.gomaps.pro/maps/api/js?key=AlzaSyGRY90wWGv1cIycdXYYuKjwkEWGq80P-Nc&libraries=places&callback=initMap',
    deliveryRadiusKm: 5,
    orderExpirationMinutes: 5,
};

async function initializeSupabaseTable(tableName: string, initialData: any[]) {
    if (!supabase) return;
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        console.error(`Error checking Supabase table '${tableName}':`, error);
        return;
    }
    if (data.length === 0 && initialData.length > 0) {
        console.log(`Supabase table '${tableName}' is empty. Populating with initial data...`);
        const { error: insertError } = await supabase.from(tableName).insert(initialData);
        if (insertError) {
            console.error(`Error populating Supabase table '${tableName}':`, insertError);
        } else {
            console.log(`Supabase table '${tableName}' populated.`);
        }
    }
}

// --- Menu Item Management (Supabase) ---
export async function getMenuItems(): Promise<MenuItem[]> {
    if (!supabase) return [];
    await initializeSupabaseTable('menuItems', initialMenuItems);
    const { data, error } = await supabase.from('menuItems').select('*').order('name');
    if (error) {
        console.error('Supabase getMenuItems error:', error);
        return [];
    }
    return data as MenuItem[];
}

export async function addMenuItem(newItemData: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.from('menuItems').insert([newItemData]).select().single();
    if (error) throw error;
    return data as MenuItem;
}

export async function updateMenuItem(updatedItem: MenuItem): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { id, ...itemData } = updatedItem;
    const { error } = await supabase.from('menuItems').update(itemData).eq('id', id);
    if (error) throw error;
}

export async function deleteMenuItem(itemId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.from('menuItems').delete().eq('id', itemId);
    if (error) throw error;
}

// --- Restaurant Stubs ---
export async function getRestaurants(): Promise<Restaurant[]> { return []; }
export async function getRestaurantById(id: string): Promise<Restaurant | undefined> { return undefined; }

// --- Order Management (Supabase) ---
export async function placeOrder(orderData: Omit<Order, 'id'>): Promise<any> {
    if (!supabase) {
        throw new Error("Supabase not configured. Cannot place order.");
    }

    const { data, error } = await supabase
        .from('orders')
        .insert([
            { ...orderData, items: JSON.stringify(orderData.items) }
        ])
        .select()
        .single();

    if (error) {
        console.error('Supabase placeOrder error:', error);
        throw error;
    }
    
    return { ...data, items: JSON.parse(data.items) };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Supabase getOrderById error:', error);
        return null;
    }
    return data as Order;
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', orderId);

    if (error) {
        console.error('Supabase updateOrderStatus error:', error);
        throw error;
    }
}

export async function cancelOrder(orderId: string, reason: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
        .from('orders')
        .update({ status: 'Cancelled', cancellationReason: reason })
        .eq('id', orderId);

    if (error) {
        console.error('Supabase cancelOrder error:', error);
        throw error;
    }
}

export async function submitOrderReview(orderId: string, review: Review): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
        .from('orders')
        .update({ review: review })
        .eq('id', orderId);

    if (error) {
        console.error('Supabase submitOrderReview error:', error);
        throw error;
    }
}

export async function deleteOrder(orderId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

    if (error) {
        console.error('Supabase deleteOrder error:', error);
        throw error;
    }
}

export async function getAllOrders(): Promise<Order[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Supabase getAllOrders error:', error);
        return [];
    }
    return data as Order[];
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    if (!supabase || !userId) return [];
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Supabase getUserOrders error:', error);
        return [];
    }
    return data as Order[];
}

// --- REAL-TIME LISTENERS (Supabase) ---
export function listenToMenuItems(callback: (items: MenuItem[]) => void): () => void {
    if (!supabase) return () => {};
    const channel = supabase
      .channel('public:menuItems')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menuItems' }, async () => {
        const allItems = await getMenuItems();
        callback(allItems);
      })
      .subscribe();
      
    getMenuItems().then(callback);

    return () => {
      supabase.removeChannel(channel);
    };
}

export function listenToAllOrders(callback: (orders: Order[]) => void): () => void {
    if (!supabase) return () => {};
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const allOrders = await getAllOrders();
        callback(allOrders);
      })
      .subscribe();
      
    getAllOrders().then(callback);

    return () => {
      supabase.removeChannel(channel);
    };
}

export function listenToUserOrders(userId: string, callback: (orders: Order[]) => void): () => void {
    if (!supabase || !userId) return () => {};
    const channel = supabase
      .channel(`public:orders:user_id=eq.${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, async () => {
        const userOrders = await getUserOrders(userId);
        callback(userOrders);
      })
      .subscribe();

    getUserOrders(userId).then(callback);

    return () => {
      supabase.removeChannel(channel);
    };
}

export function listenToUserAdminMessages(userId: string, callback: (messages: AdminMessage[]) => void): () => void {
    if (!supabase || !userId) return () => {};
    const channel = supabase
        .channel(`public:adminMessages:userId=eq.${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'adminMessages', filter: `userId=eq.${userId}` }, async (payload) => {
            callback([payload.new as AdminMessage]);
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
}

export function listenToSupportTickets(callback: (tickets: SupportTicket[]) => void): () => void {
    if (!supabase) return () => {};
    const channel = supabase
      .channel('public:supportTickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supportTickets' }, async () => {
        const allTickets = await getSupportTickets();
        callback(allTickets);
      })
      .subscribe();
      
    getSupportTickets().then(callback);

    return () => {
      supabase.removeChannel(channel);
    };
}


// --- Address Management (Supabase) ---
export async function getAddresses(userId: string): Promise<Address[]> {
    if (!supabase || !userId) return [];
    const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId);
    if (error) {
        console.error('Supabase getAddresses error:', error);
        return [];
    }
    return data as Address[];
}

export async function addAddress(userId: string, addressData: Omit<Address, 'id'>): Promise<Address> {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.from('addresses').insert([{ ...addressData, user_id: userId }]).select().single();
    if (error) throw error;
    return data as Address;
}

export async function updateAddress(userId: string, updatedAddress: Address): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { id, ...addressData } = updatedAddress;
    const { error } = await supabase.from('addresses').update(addressData).eq('id', id).eq('user_id', userId);
    if (error) throw error;
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', userId);
    if (error) throw error;
}

export async function setDefaultAddress(userId: string, addressIdToSetDefault: string): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error: unsetError } = await supabase.from('addresses').update({ isDefault: false }).eq('user_id', userId).eq('isDefault', true);
    if (unsetError) throw unsetError;
    const { error: setError } = await supabase.from('addresses').update({ isDefault: true }).eq('id', addressIdToSetDefault).eq('user_id', userId);
    if (setError) throw setError;
}

// --- Hero Section Management (Supabase) ---
export async function getHeroData(): Promise<HeroData> {
    if (!supabase) return defaultHeroData;
    const { data, error } = await supabase.from('globals').select('content').eq('id', 'hero').single();
    if (error || !data) {
        console.warn('Supabase getHeroData warning (falling back to default):', error?.message);
        return defaultHeroData;
    }
    return { ...defaultHeroData, ...data.content } as HeroData;
}

export async function updateHeroData(data: HeroData): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.from('globals').upsert({ id: 'hero', content: data });
    if (error) throw error;
}

// --- Payment Settings Management (Supabase) ---
export async function getPaymentSettings(): Promise<PaymentSettings> {
    if (!supabase) return defaultPaymentSettings;
    const { data, error } = await supabase.from('globals').select('content').eq('id', 'paymentSettings').single();
    if (error || !data) {
        console.warn('Supabase getPaymentSettings warning (falling back to default):', error?.message);
        const { error: insertError } = await supabase.from('globals').insert([{ id: 'paymentSettings', content: defaultPaymentSettings }]);
        if(insertError) console.error("Could not insert default payment settings:", insertError);
        return defaultPaymentSettings;
    }
    return { ...defaultPaymentSettings, ...data.content };
}

export async function updatePaymentSettings(data: Partial<PaymentSettings>): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const currentSettings = await getPaymentSettings();
    const newSettings = { ...currentSettings, ...data };
    const { error } = await supabase.from('globals').upsert({ id: 'paymentSettings', content: newSettings });
    if (error) throw error;
}

// --- Analytics Data (Supabase) ---
export async function processAnalyticsData(allOrders: Order[], dateRange?: { from: Date; to: Date }): Promise<AnalyticsData> {
    if (!supabase) return { totalRevenue: 0, totalProfit: 0, totalOrders: 0, totalLoss: 0, totalCancelledOrders: 0, chartData: [] };

    let queryBuilder = supabase.from('orders').select('*');

    if (dateRange?.from && dateRange.to) {
        queryBuilder = queryBuilder
            .gte('date', dateRange.from.toISOString())
            .lte('date', dateRange.to.toISOString());
    }

    const { data: filteredOrders, error } = await queryBuilder;

    if (error) {
        console.error('Supabase processAnalyticsData error:', error);
        return { totalRevenue: 0, totalProfit: 0, totalOrders: 0, totalLoss: 0, totalCancelledOrders: 0, chartData: [] };
    }

    const deliveredOrders = (filteredOrders || []).filter(o => o.status === 'Delivered');
    const cancelledOrders = (filteredOrders || []).filter(o => o.status === 'Cancelled');

    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = deliveredOrders.length;
    
    const totalLoss = cancelledOrders.reduce((sum, order) => sum + order.total, 0);
    const totalCancelledOrders = cancelledOrders.length;
    
    const dailyData: Map<string, { revenue: number; profit: number; loss: number }> = new Map();

    let totalProfit = 0;
    deliveredOrders.forEach(order => {
        const date = new Date(order.date).toISOString().split('T')[0];
        const dayData = dailyData.get(date) || { revenue: 0, profit: 0, loss: 0 };
        
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        
        const itemsCost = items.reduce((sum: number, item: any) => {
            const cost = item.costPrice ?? (item.price * 0.70);
            return sum + (cost * item.quantity);
        }, 0);
        
        const orderProfit = order.total - (order.totalTax || 0) - (order.deliveryFee || 0) - (order.discountAmount || 0) - itemsCost;

        totalProfit += orderProfit;
        
        dayData.revenue += order.total;
        dayData.profit += orderProfit;
        dailyData.set(date, dayData);
    });

    cancelledOrders.forEach(order => {
        const date = new Date(order.date).toISOString().split('T')[0];
        const dayData = dailyData.get(date) || { revenue: 0, profit: 0, loss: 0 };
        dayData.loss += order.total;
        dailyData.set(date, dayData);
    });
    
    if (dateRange?.from && dateRange.to) {
        let currentDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            if (!dailyData.has(dateString)) {
                dailyData.set(dateString, { revenue: 0, profit: 0, loss: 0 });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    
    const chartData: DailyChartData[] = Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        totalRevenue,
        totalProfit,
        totalOrders,
        totalLoss,
        totalCancelledOrders,
        chartData,
    };
}

export async function getAnalyticsData(dateRange?: { from: Date; to: Date }): Promise<AnalyticsData> {
    const allOrders = await getAllOrders();
    return processAnalyticsData(allOrders, dateRange);
}

// --- Admin Messaging & User Profile (Supabase) ---
export async function getAllUsers(): Promise<UserRef[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('id, email');
    if (error) {
        console.error('Supabase getAllUsers error:', error);
        return [];
    }
    return data as UserRef[];
}

export async function getUserProfile(userId: string): Promise<DocumentData | null> {
    if (!supabase || !userId) return null;
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
        console.error('Supabase getUserProfile error:', error);
        return null;
    }
    return data;
}

export async function updateUserProfileData(userId: string, data: { displayName?: string, mobileNumber?: string }): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error("Unauthorized. User is not logged in or mismatch.");
    }
    const { error } = await supabase.from('users').update(data).eq('id', userId);
    if (error) throw error;
}

export async function sendAdminMessage(userId: string, userEmail: string, title: string, message: string): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.from('adminMessages').insert([{ userId, userEmail, title, message }]);
    if (error) throw error;
}

// --- Support Ticket Management (Supabase) ---
export async function sendSupportMessage(messageData: Omit<SupportTicket, 'id' | 'timestamp' | 'status'>): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.from('supportTickets').insert([{ ...messageData, status: 'Open' }]);
    if (error) throw error;
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('supportTickets').select('*').order('timestamp', { ascending: false });
    if (error) {
        console.error('Supabase getSupportTickets error:', error);
        return [];
    }
    return data as SupportTicket[];
}

export async function replyToSupportTicket(ticketId: string, userId: string, userEmail: string, replyText: string): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.from('supportTickets').update({ status: 'Replied', reply: replyText, repliedAt: new Date().toISOString() }).eq('id', ticketId);
    if (error) throw error;
    await sendAdminMessage(userId, userEmail, `Re: Your Support Ticket #${ticketId.slice(-6)}`, replyText);
}

export async function resolveSupportTicket(ticketId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.from('supportTickets').update({ status: 'Resolved' }).eq('id', ticketId);
    if (error) throw error;
}

// --- Coupon Management (Supabase) ---
export async function getCoupons(): Promise<Coupon[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('coupons').select('*').order('createdAt', { ascending: false });
    if (error) {
        console.error('Supabase getCoupons error:', error);
        return [];
    }
    return data as Coupon[];
}

export async function addCoupon(couponData: Omit<Coupon, 'id' | 'createdAt'>): Promise<Coupon> {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.from('coupons').insert([couponData]).select().single();
    if (error) throw error;
    return data as Coupon;
}

export async function updateCoupon(couponData: Partial<Coupon> & { id: string }): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { id, ...dataToUpdate } = couponData;
    const { error } = await supabase.from('coupons').update(dataToUpdate).eq('id', id);
    if (error) throw error;
}

export async function deleteCoupon(couponId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.from('coupons').delete().eq('id', couponId);
    if (error) throw error;
}

export async function checkCoupon(code: string): Promise<{ isValid: boolean, discountPercent?: number, error?: string }> {
    if (!supabase) return { isValid: false, error: "Database not configured." };
    const { data, error } = await supabase.from('coupons').select('*').eq('code', code).single();
    
    if (error || !data) {
        return { isValid: false, error: "This coupon code does not exist." };
    }
    
    const couponData = data as Coupon;

    if (couponData.status !== 'active') {
        return { isValid: false, error: "This coupon is currently inactive." };
    }

    const now = new Date();
    const validFrom = new Date(couponData.validFrom);
    const validUntil = new Date(couponData.validUntil);

    if (validFrom && now < validFrom) {
        return { isValid: false, error: `This coupon is not active yet. It starts on ${validFrom.toLocaleDateString()}.` };
    }

    if (validUntil) {
        validUntil.setHours(23, 59, 59, 999);
        if (now > validUntil) {
            return { isValid: false, error: "This coupon has expired." };
        }
    }
  
    return { isValid: true, discountPercent: couponData.discountPercent };
}
