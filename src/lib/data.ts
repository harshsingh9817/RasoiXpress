

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
  type Firestore,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { supabase } from './supabase';
import type { Restaurant, MenuItem, Order, Address, Review, HeroData, PaymentSettings, AnalyticsData, DailyChartData, AdminMessage, UserRef, SupportTicket, Coupon, Category, CartItem, RestaurantTime } from './types';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore as getSecondaryFirestore } from 'firebase/firestore';


// --- Rider App Firebase Configuration ---
const riderFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_RIDER_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_RIDER_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_RIDER_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_RIDER_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_RIDER_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_RIDER_FIREBASE_APP_ID
};

const riderConfigIsValid = riderFirebaseConfig.apiKey && !riderFirebaseConfig.apiKey.startsWith('REPLACE_WITH_');
let riderApp: FirebaseApp | undefined;
let riderDb: Firestore | undefined;
let riderAuth: Auth | undefined;

if (riderConfigIsValid) {
    const RIDER_APP_NAME = 'riderApp';
    const secondaryApps = getApps();
    riderApp = !secondaryApps.some(app => app.name === RIDER_APP_NAME)
      ? initializeApp(riderFirebaseConfig, RIDER_APP_NAME)
      : getApp(RIDER_APP_NAME);

    riderDb = getSecondaryFirestore(riderApp);
    riderAuth = getAuth(riderApp);
} else {
    console.warn('Rider app Firebase configuration is missing or incomplete in .env. Rider integration features will be disabled.');
}


let riderAuthPromise: Promise<any> | null = null;
async function ensureRiderAuth() {
    if (!riderAuth) throw new Error("Rider Auth service is not initialized due to missing configuration.");
    if (riderAuth.currentUser) {
        return riderAuth.currentUser;
    }
    if (!riderAuthPromise) {
        riderAuthPromise = signInAnonymously(riderAuth);
    }
    try {
        const userCredential = await riderAuthPromise;
        return userCredential.user;
    } catch (error) {
        console.error("Anonymous sign-in to rider service failed:", error);
        riderAuthPromise = null; 
        throw error;
    }
}


// --- Initial Data ---
const initialMenuItems: Omit<MenuItem, 'id'>[] = [];

const defaultHeroData: HeroData = {
    media: [],
    slideInterval: 5,
    orderingTime: "7:30 AM - 9:00 PM",
};

const defaultPaymentSettings: PaymentSettings = {
    isRazorpayEnabled: true,
    isDeliveryFeeEnabled: true,
    deliveryRadiusKm: 5,
    orderExpirationMinutes: 5,
    mapApiUrl: "",
    merchantName: "Rasoi Xpress",
};

const defaultRestaurantTime: RestaurantTime = {
    openTime: '10:00',
    closeTime: '22:00',
};

async function initializeCollection(collectionName: string, initialData: any[]) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty && initialData.length > 0) {
        console.log(`Collection '${collectionName}' is empty. Populating with initial data...`);
        const batch = writeBatch(db);
        initialData.forEach(item => {
            const docRef = doc(collectionRef);
            batch.set(docRef, item);
        });
        await batch.commit();
        console.log(`Collection '${collectionName}' populated.`);
    }
}

// --- Menu Item Management (Firestore) ---
export async function getMenuItems(includeHidden: boolean = false): Promise<MenuItem[]> {
    const menuItemsCol = collection(db, 'menuItems');
    let q;
    if (includeHidden) {
      // Admin gets all items
      q = query(menuItemsCol, orderBy("name"));
    } else {
      // Users only get visible items
      await initializeCollection('menuItems', initialMenuItems);
      q = query(menuItemsCol, where("isVisible", "==", true), orderBy("name"));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
}

export async function addMenuItem(newItemData: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const menuItemsCol = collection(db, 'menuItems');
    const cleanData: { [key: string]: any } = {};
    Object.entries(newItemData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanData[key] = value;
      }
    });
    // Ensure new items are visible by default
    if (cleanData.isVisible === undefined) {
      cleanData.isVisible = true;
    }

    const docRef = await addDoc(menuItemsCol, cleanData);
    const docSnap = await getDoc(docRef);
    return { id: docSnap.id, ...docSnap.data() } as MenuItem;
}

export async function updateMenuItem(updatedItem: MenuItem): Promise<void> {
    const { id, ...itemData } = updatedItem;
    const docRef = doc(db, 'menuItems', id);
    const cleanData: { [key: string]: any } = JSON.parse(JSON.stringify(itemData));
    
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === null || cleanData[key] === '') {
            delete cleanData[key];
        }
    });

    await updateDoc(docRef, cleanData);
}

export async function deleteMenuItem(itemId: string): Promise<void> {
    const docRef = doc(db, 'menuItems', itemId);
    await deleteDoc(docRef);
}

// --- Restaurant Stubs ---
export async function getRestaurants(): Promise<Restaurant[]> { return []; }
export async function getRestaurantById(id: string): Promise<Restaurant | undefined> { return undefined; }

// --- Order Management (Firebase & Supabase) ---
export async function placeOrder(orderData: Omit<Order, 'id'>): Promise<Order> {
    const ordersCol = collection(db, 'orders');
    const docRef = await addDoc(ordersCol, {
      ...orderData,
      createdAt: serverTimestamp(),
    });
    
    const userRef = doc(db, "users", orderData.userId);
    try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data()?.hasCompletedFirstOrder === false) {
            await updateDoc(userRef, { hasCompletedFirstOrder: true });
        }
    } catch (error) {
        console.error("Failed to update first order status for user:", orderData.userId, error);
    }
  
    // Now, sync to Supabase for the rider app
    if (supabase) {
      const orderForSupabase = {
        ...orderData,
        firebase_order_id: docRef.id,
      };
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([orderForSupabase])
          .select()
          .single();
  
        if (error) {
          console.error(`Supabase insert error for order ${docRef.id}:`, error.message);
        } else if (data) {
          // If successful, update the Firestore doc with the Supabase UUID
          await updateDoc(docRef, { supabase_order_uuid: data.id });
          return { ...orderData, id: docRef.id, supabase_order_uuid: data.id } as Order;
        }
      } catch (e) {
        console.error("Unexpected error syncing order to Supabase:", e);
      }
    }
  
    return { ...orderData, id: docRef.id } as Order;
}


export async function getOrderById(orderId: string): Promise<Order | null> {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Order : null;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status: status });

    if (supabase) {
        try {
            const orderSnap = await getDoc(docRef);
            if (!orderSnap.exists() || !orderSnap.data()?.supabase_order_uuid) {
                console.warn(`Cannot update order ${orderId} in Supabase: supabase_order_uuid not found.`);
                return;
            }
            const supabaseUUID = orderSnap.data()?.supabase_order_uuid;

            const { error: supabaseError } = await supabase
                .from('orders')
                .update({ status: status })
                .eq('id', supabaseUUID); 

            if (supabaseError) {
                console.error(`Supabase status update error for order ${orderId}:`, supabaseError.message);
            }
        } catch (error) {
            console.error(`Unexpected error updating order ${orderId} status in Supabase:`, error);
        }
    }
}

export async function cancelOrder(orderId: string, reason: string): Promise<void> {
    await updateOrderStatus(orderId, 'Cancelled'); 
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { cancellationReason: reason });
}

export async function submitOrderReview(orderId: string, review: Review): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { review });
}

export async function deleteOrder(orderId: string): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    if (supabase) {
        try {
            const orderSnap = await getDoc(docRef);
            if (orderSnap.exists() && orderSnap.data()?.supabase_order_uuid) {
                const supabaseUUID = orderSnap.data()?.supabase_order_uuid;
                await supabase.from('orders').delete().eq('id', supabaseUUID);
            }
        } catch (error) {
            console.error(`Failed to delete order ${orderId} from Supabase:`, error);
        }
    }
    await deleteDoc(docRef);
}

export async function getAllOrders(): Promise<Order[]> {
    const ordersCol = collection(db, 'orders');
    const snapshot = await getDocs(query(ordersCol));
    const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
    return allOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    if (!userId) return [];
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
    return userOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function updateOrderPaymentDetails(orderId: string, paymentDetails: { razorpayPaymentId: string; razorpayOrderId: string; }): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, paymentDetails);
}

// --- Cart Management (Firestore) ---
export function listenToUserCart(userId: string, callback: (items: CartItem[]) => void): () => void {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const cartColRef = collection(db, 'users', userId, 'cart');
    return onSnapshot(cartColRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CartItem[];
        callback(items);
    }, (error) => {
        console.error("Error listening to user cart:", error);
        callback([]);
    });
}

export async function updateUserCartItem(userId: string, item: CartItem): Promise<void> {
    if (!userId) return;
    const cartItemRef = doc(db, 'users', userId, 'cart', item.id);
    await setDoc(cartItemRef, item, { merge: true });
}

export async function removeUserCartItem(userId: string, itemId: string): Promise<void> {
    if (!userId) return;
    const cartItemRef = doc(db, 'users', userId, 'cart', itemId);
    await deleteDoc(cartItemRef);
}

export async function clearUserCart(userId: string): Promise<void> {
    if (!userId) return;
    const cartColRef = collection(db, 'users', userId, 'cart');
    const snapshot = await getDocs(cartColRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

// --- REAL-TIME LISTENERS (Firestore) ---
export function listenToMenuItems(callback: (items: MenuItem[]) => void, isAdmin: boolean = false): () => void {
    const menuItemsCol = collection(db, 'menuItems');
    let q;
    if (isAdmin) {
      q = query(menuItemsCol, orderBy("name"));
    } else {
      q = query(menuItemsCol, where("isVisible", "==", true), orderBy("name"));
    }
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
        callback(items);
    }, (error) => {
        console.error("Error listening to menu items:", error);
    });
}

export function listenToAllOrders(callback: (orders: Order[]) => void): () => void {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        callback(allOrders);
    });
}

export function listenToUserOrders(userId: string, callback: (orders: Order[]) => void): () => void {
    if (!userId) return () => {};
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('userId', '==', userId), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        callback(userOrders);
    }, (error) => {
        console.error("Error listening to user orders:", error);
    });
}

export function listenToUserAdminMessages(userId: string, callback: (messages: AdminMessage[]) => void): () => void {
    if (!userId) return () => {};

    const messagesCol = collection(db, 'adminMessages');
    const individualQuery = query(messagesCol, where('type', '==', 'individual'), where('userId', '==', userId));
    const broadcastQuery = query(messagesCol, where('type', '==', 'broadcast'));

    const fetchAndCallback = async () => {
        try {
            const [individualSnapshot, broadcastSnapshot] = await Promise.all([
                getDocs(individualQuery),
                getDocs(broadcastQuery),
            ]);

            const individualMessages = individualSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, timestamp: doc.data().timestamp?.toMillis() || Date.now() })) as AdminMessage[];
            const broadcastMessages = broadcastSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, timestamp: doc.data().timestamp?.toMillis() || Date.now() })) as AdminMessage[];
            
            const allMessages = [...individualMessages, ...broadcastMessages].sort((a, b) => b.timestamp - a.timestamp);
            callback(allMessages);
        } catch (error) {
            console.error("Error fetching all admin messages:", error);
        }
    };
    
    fetchAndCallback();

    const individualUnsub = onSnapshot(individualQuery, fetchAndCallback);
    const broadcastUnsub = onSnapshot(broadcastQuery, fetchAndCallback);
    
    return () => {
        individualUnsub();
        broadcastUnsub();
    };
}


export function listenToSupportTickets(callback: (tickets: SupportTicket[]) => void): () => void {
    const ticketsCol = collection(db, 'supportTickets');
    const q = query(ticketsCol, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, timestamp: doc.data().timestamp?.toMillis() || Date.now() })) as SupportTicket[];
        callback(tickets);
    });
}

export function listenToRiderAppOrders(): () => void {
    if (!supabase) {
      console.warn("Supabase client not initialized. Cannot listen to rider app orders.");
      return () => {};
    }
  
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          const riderOrderData = payload.new as any;
          const supabaseUUID = riderOrderData.id;
          if (!supabaseUUID) return;
  
          try {
            const ordersRef = collection(db, "orders");
            const q = query(ordersRef, where("supabase_order_uuid", "==", supabaseUUID));
            const querySnapshot = await getDocs(q);
  
            if (!querySnapshot.empty) {
                const mainOrderDoc = querySnapshot.docs[0];
                const mainOrderRef = mainOrderDoc.ref;
                const status = riderOrderData.status as OrderStatus;
    
                const updatedFields: { [key: string]: any } = {};
    
                if (status) {
                    updatedFields.status = status;
                }
    
                if (riderOrderData.rider_id != null) updatedFields.deliveryRiderId = riderOrderData.rider_id;
                if (riderOrderData.rider_name != null) updatedFields.deliveryRiderName = riderOrderData.rider_name;
                if (riderOrderData.rider_phone != null) updatedFields.deliveryRiderPhone = riderOrderData.rider_phone;
                if (riderOrderData.rider_vehicle != null) updatedFields.deliveryRiderVehicle = riderOrderData.rider_vehicle;
                
                if (Object.keys(updatedFields).length > 0) {
                    await updateDoc(mainOrderRef, updatedFields);
                }

            } else {
              console.warn(`Could not find matching Firebase order for Supabase UUID: ${supabaseUUID}`);
            }
          } catch (error) {
            console.error("Failed to sync rider update to main DB:", error);
          }
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }

// --- Address Management (Firestore) ---
export async function getAddresses(userId: string): Promise<Address[]> {
    if (!userId) return [];
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const snapshot = await getDocs(addressesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Address[];
}

export async function addAddress(userId: string, addressData: Omit<Address, 'id'>): Promise<Address> {
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const docRef = await addDoc(addressesCol, addressData);
    return { ...addressData, id: docRef.id } as Address;
}

export async function updateAddress(userId: string, updatedAddress: Partial<Address> & { id: string }): Promise<void> {
    const { id, ...addressData } = updatedAddress;
    const docRef = doc(db, 'users', userId, 'addresses', id);
    await updateDoc(docRef, addressData);
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'addresses', addressId);
    await deleteDoc(docRef);
}

export async function setDefaultAddress(userId: string, addressIdToSetDefault: string): Promise<void> {
    const batch = writeBatch(db);
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const q = query(addressesCol, where('isDefault', '==', true));
    const currentDefaultSnapshot = await getDocs(q);
    currentDefaultSnapshot.forEach(docSnap => {
        batch.update(docSnap.ref, { isDefault: false });
    });
    const newDefaultRef = doc(db, 'users', userId, 'addresses', addressIdToSetDefault);
    batch.update(newDefaultRef, { isDefault: true });
    await batch.commit();
}

// --- Hero Section Management (Firestore) ---
export async function getHeroData(): Promise<HeroData> {
    const docRef = doc(db, 'globals', 'hero');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, defaultHeroData);
        return defaultHeroData;
    }
    const data = docSnap.data();
    return { ...defaultHeroData, ...data } as HeroData;
}

export async function updateHeroData(data: Partial<HeroData>): Promise<void> {
    const docRef = doc(db, 'globals', 'hero');
    await setDoc(docRef, data, { merge: true });
}


// --- Payment Settings Management (Firestore) ---
export async function getPaymentSettings(): Promise<PaymentSettings> {
    const docRef = doc(db, 'globals', 'paymentSettings');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, defaultPaymentSettings);
        return defaultPaymentSettings;
    }
    return { ...defaultPaymentSettings, ...docSnap.data() };
}

export async function updatePaymentSettings(data: Partial<PaymentSettings>): Promise<void> {
    const docRef = doc(db, 'globals', 'paymentSettings');
    await setDoc(docRef, data, { merge: true });
}

// --- Restaurant Time Management ---
export async function getRestaurantTime(): Promise<RestaurantTime> {
    const docRef = doc(db, 'globals', 'restaurantTime');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, defaultRestaurantTime);
        return defaultRestaurantTime;
    }
    return docSnap.data() as RestaurantTime;
}

export async function updateRestaurantTime(data: RestaurantTime): Promise<void> {
    const docRef = doc(db, 'globals', 'restaurantTime');
    await setDoc(docRef, data, { merge: true });
}

// --- Analytics Data (Firestore) ---
export function processAnalyticsData(allOrders: Order[], dateRange?: { from: Date; to: Date }): AnalyticsData {
    const filteredOrders = dateRange?.from && dateRange.to
        ? allOrders.filter(order => {
            const orderDate = new Date(order.date);
            const from = new Date(dateRange.from);
            from.setHours(0, 0, 0, 0);
            const to = new Date(dateRange.to);
            to.setHours(23, 59, 59, 999);
            return orderDate >= from && orderDate <= to;
        })
        : allOrders;

    const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');
    const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled');

    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = deliveredOrders.length;
    const totalLoss = cancelledOrders.reduce((sum, order) => sum + order.total, 0);
    const totalCancelledOrders = cancelledOrders.length;
    
    const dailyData: Map<string, { revenue: number; profit: number; loss: number }> = new Map();
    let totalProfit = 0;

    deliveredOrders.forEach(order => {
        const date = new Date(order.date).toISOString().split('T')[0];
        const dayData = dailyData.get(date) || { revenue: 0, profit: 0, loss: 0 };
        const itemsCost = (Array.isArray(order.items) ? order.items : []).reduce((sum, item) => {
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

    return { totalRevenue, totalProfit, totalOrders, totalLoss, totalCancelledOrders, chartData };
}

// --- Admin Messaging & User Profile (Firestore) ---
export async function getAllUsers(): Promise<UserRef[]> {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email })) as UserRef[];
}

export async function getUserProfile(userId: string): Promise<DocumentData | null> {
    if (!userId) return null;
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
}

export async function updateUserProfileData(userId: string, data: { displayName?: string, mobileNumber?: string }): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error("Unauthorized.");
    
    if(data.displayName && data.displayName !== auth.currentUser.displayName) {
        await auth.currentUser.updateProfile({ displayName: data.displayName });
    }
    
    await setDoc(doc(db, 'users', userId), data, { merge: true });
}

export async function sendAdminMessage(
  typeOrUserId: 'broadcast' | string,
  titleOrUserEmail: string,
  messageOrTitle: string,
  optionsOrMessage?: { userId?: string; userEmail?: string | null; link?: string } | string
): Promise<void> {
    const messagesCol = collection(db, 'adminMessages');
    let dataToSend: { [key: string]: any } = { timestamp: serverTimestamp() };

    if (typeof optionsOrMessage === 'object' || optionsOrMessage === undefined) {
        const type = typeOrUserId;
        const title = titleOrUserEmail;
        const message = messageOrTitle;
        const options = optionsOrMessage;

        dataToSend = { ...dataToSend, type, title, message };

        if (type === 'individual') {
            if (!options?.userId) {
                throw new Error("userId is required for individual messages.");
            }
            dataToSend.userId = options.userId;
            dataToSend.userEmail = options.userEmail || null;
        }

        if (options?.link) {
            dataToSend.link = options.link;
        }

    } else {
        const userId = typeOrUserId;
        const userEmail = titleOrUserEmail;
        const title = messageOrTitle;
        const message = optionsOrMessage;

        dataToSend = {
            ...dataToSend,
            type: 'individual',
            userId,
            userEmail: userEmail || null,
            title,
            message,
        };
    }
    
    if (dataToSend.link && typeof dataToSend.link === 'string' && dataToSend.link.trim() === '') {
        delete dataToSend.link;
    }

    await addDoc(messagesCol, dataToSend);
}



// --- Support Ticket Management (Firestore) ---
export async function sendSupportMessage(messageData: Omit<SupportTicket, 'id' | 'timestamp' | 'status'>): Promise<void> {
    const supportCol = collection(db, 'supportTickets');
    await addDoc(supportCol, { ...messageData, status: 'Open', timestamp: serverTimestamp() });
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
    const ticketsCol = collection(db, 'supportTickets');
    const q = query(ticketsCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, timestamp: doc.data().timestamp?.toMillis() || Date.now() })) as SupportTicket[];
}

export async function replyToSupportTicket(ticketId: string, userId: string, userEmail: string, replyText: string): Promise<void> {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketRef, { status: 'Replied', reply: replyText, repliedAt: serverTimestamp() });
    await sendAdminMessage('individual', `Re: Your Support Ticket #${ticketId.slice(-6)}`, replyText, { userId, userEmail });
}

export async function resolveSupportTicket(ticketId: string): Promise<void> {
    const docRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(docRef, { status: 'Resolved' });
}

// --- Coupon Management (Firestore) ---
export async function getCoupons(): Promise<Coupon[]> {
    const couponsCol = collection(db, 'coupons');
    const now = new Date();
    const snapshot = await getDocs(query(couponsCol, orderBy('createdAt', 'desc')));
    
    const allCoupons = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id, 
        createdAt: doc.data().createdAt.toDate(), 
        validFrom: doc.data().validFrom.toDate(), 
        validUntil: doc.data().validUntil.toDate() 
    })) as Coupon[];
    
    const validCoupons: Coupon[] = [];
    const expiredCouponIds: string[] = [];

    allCoupons.forEach(coupon => {
        if (coupon.validUntil < now) {
            expiredCouponIds.push(coupon.id);
        } else {
            validCoupons.push(coupon);
        }
    });

    if (expiredCouponIds.length > 0) {
        console.log(`Removing ${expiredCouponIds.length} expired coupons...`);
        const batch = writeBatch(db);
        expiredCouponIds.forEach(id => {
            batch.delete(doc(db, 'coupons', id));
        });
        await batch.commit();
    }
    
    return validCoupons;
}

export async function addCoupon(couponData: Omit<Coupon, 'id' | 'createdAt'>): Promise<Coupon> {
    const docRef = await addDoc(collection(db, 'coupons'), { ...couponData, createdAt: serverTimestamp() });
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    return { 
        ...couponData, 
        id: docRef.id, 
        createdAt: data?.createdAt.toDate(),
        validFrom: data?.validFrom.toDate(),
        validUntil: data?.validUntil.toDate(),
    } as Coupon;
}

export async function updateCoupon(couponData: Partial<Coupon> & { id: string }): Promise<void> {
    const { id, ...dataToUpdate } = couponData;
    await updateDoc(doc(db, 'coupons', id), dataToUpdate);
}

export async function deleteCoupon(couponId: string): Promise<void> {
    await deleteDoc(doc(db, 'coupons', couponId));
}

export async function checkCoupon(code: string, userId: string): Promise<{ isValid: boolean, coupon?: Coupon, error?: string }> {
    const q = query(collection(db, 'coupons'), where('code', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { isValid: false, error: "This coupon code does not exist." };
    
    const couponDoc = snapshot.docs[0];
    const couponData = { ...couponDoc.data(), id: couponDoc.id, validFrom: couponDoc.data().validFrom.toDate(), validUntil: couponDoc.data().validUntil.toDate() } as Coupon;

    if (couponData.status !== 'active') return { isValid: false, error: "This coupon is currently inactive." };
    
    const now = new Date();
    
    if (now < couponData.validFrom) return { isValid: false, error: `This coupon is not active yet. It starts on ${couponData.validFrom.toLocaleDateString()}.` };
    if (now > couponData.validUntil) return { isValid: false, error: "This coupon has expired." };

    const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        where('couponCode', '==', code)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    if (!ordersSnapshot.empty) {
        return { isValid: false, error: "You have already used this coupon code." };
    }
    
    return { isValid: true, coupon: couponData };
}

// --- Category Management (Firestore) ---
export async function getCategories(): Promise<Category[]> {
    const categoriesCol = collection(db, 'categories');
    const q = query(categoriesCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
}

export async function addCategory(categoryData: Omit<Category, 'id'>): Promise<Category> {
    const docRef = await addDoc(collection(db, 'categories'), categoryData);
    return { ...categoryData, id: docRef.id };
}

export async function updateCategory(categoryData: Category): Promise<void> {
    const { id, ...data } = categoryData;
    await updateDoc(doc(db, 'categories', id), data);
}

export async function deleteCategory(categoryId: string): Promise<void> {
    await deleteDoc(doc(db, 'categories', categoryId));
}

export function listenToCategories(callback: (categories: Category[]) => void): () => void {
    const categoriesCol = collection(db, 'categories');
    const q = query(categoriesCol, orderBy("name"));
    return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        callback(categories);
    }, (error) => {
        console.error("Error listening to categories:", error);
    });
}
