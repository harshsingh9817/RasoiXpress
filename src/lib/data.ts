

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
  type Query,
  type DocumentData,
  onSnapshot,
  deleteField,
  type Firestore,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import type { Restaurant, MenuItem, Order, Address, Review, HeroData, PaymentSettings, AnalyticsData, DailyChartData, AdminMessage, UserRef, SupportTicket, BannerImage } from './types';
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
    if (!riderAuth) {
        console.warn("Rider Auth service is not initialized due to missing configuration.");
        return null;
    }
    if (riderAuth.currentUser) {
        return riderAuth.currentUser;
    }

    if (!riderAuthPromise) {
        riderAuthPromise = signInAnonymously(riderAuth)
          .catch(error => {
              console.error("Rider App Anonymous Sign-In Failed.", error);
              console.error("This is likely because 'Anonymous' sign-in is not enabled in the 'rasoi-rider-connect' Firebase project's Authentication settings. Please enable it in the Firebase Console.");
              riderAuthPromise = null; 
              return null; 
          });
    }
    
    return await riderAuthPromise;
}


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
};

const defaultPaymentSettings: PaymentSettings = {
    upiId: 'rasoixpress@okbank',
    qrCodeImageUrl: 'https://placehold.co/250x250.png?text=Scan+to+Pay',
    isRazorpayEnabled: true,
    isDeliveryFeeEnabled: true,
    mapApiUrl: 'https://maps.gomaps.pro/maps/api/js?key=AlzaSyGRY90wWGv1cIycdXYYuKjwkEWGq80P-Nc&libraries=places&callback=initMap',
    deliveryRadiusKm: 5,
};

async function initializeCollection(collectionName: string, initialData: any[]) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty && initialData.length > 0) {
        console.log(`Collection '${collectionName}' is empty. Populating with initial data...`);
        const promises = initialData.map(item => addDoc(collectionRef, item));
        await Promise.all(promises);
        console.log(`Collection '${collectionName}' populated.`);
    }
}

// --- Menu Item Management ---
export async function getMenuItems(): Promise<MenuItem[]> {
    await initializeCollection('menuItems', initialMenuItems);
    const menuItemsCol = collection(db, 'menuItems');
    const q = query(menuItemsCol, orderBy("name"));
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

// --- Order Management ---
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

    return { ...orderData, id: docRef.id } as Order;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
    }

    return null;
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    
    const updateData: { [key: string]: any } = { status };
    if (status === 'Preparing') {
        updateData.isAvailableForPickup = true;
    } else if (status === 'Out for Delivery' || status === 'Cancelled') {
        updateData.isAvailableForPickup = false;
    }
    
    if (status === 'Delivered') {
        updateData.isAvailableForPickup = false;
        updateData.deliveryConfirmationCode = deleteField();
    }
    
    await updateDoc(docRef, updateData);

    if (status === 'Out for Delivery') {
        if (riderDb) {
            const riderUser = await ensureRiderAuth();
            if (riderUser) {
                try {
                    const orderSnap = await getDoc(docRef);
                    if (orderSnap.exists()) {
                        const orderData = { id: orderSnap.id, ...orderSnap.data() };
                        const riderOrderRef = doc(riderDb, 'orders', orderId);
                        await setDoc(riderOrderRef, orderData, { merge: true });
                    }
                } catch (error) {
                     console.error("Failed to sync order to rider database:", error);
                }
            }
        } else {
            console.warn("Rider DB not configured, skipping order sync for 'Out for Delivery'.");
        }
    }
}


export async function cancelOrder(orderId: string, reason: string): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status: 'Cancelled', cancellationReason: reason });
}

export async function submitOrderReview(orderId: string, review: Review): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    const cleanReview: { [key: string]: any } = {
        rating: review.rating,
        date: review.date,
    };
    if (review.comment && review.comment.trim()) {
        cleanReview.comment = review.comment.trim();
    }
    await updateDoc(docRef, { review: cleanReview });
}

export async function deleteOrder(orderId: string): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
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

// --- REAL-TIME LISTENERS ---
export function listenToMenuItems(callback: (items: MenuItem[]) => void): () => void {
    const menuItemsCol = collection(db, 'menuItems');
    const q = query(menuItemsCol, orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
        callback(items);
    }, (error) => {
        console.error("Error listening to menu items:", error);
    });
    return unsubscribe;
}

export function listenToAllOrders(callback: (orders: Order[]) => void): () => void {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        callback(allOrders);
    }, (error) => {
        console.error("Error listening to all orders:", error);
    });
    return unsubscribe;
}

export function listenToUserOrders(userId: string, callback: (orders: Order[]) => void): () => void {
    if (!userId) return () => {};
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('userId', '==', userId), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        callback(userOrders);
    }, (error) => {
        console.error("Error listening to user orders:", error);
    });
    return unsubscribe;
}

export function listenToOrderById(orderId: string, callback: (order: Order | null) => void): () => void {
    const docRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as Order);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to order by ID:", error);
    });
    return unsubscribe;
}

export function listenToUserAdminMessages(userId: string, callback: (messages: AdminMessage[]) => void): () => void {
    if (!userId) return () => {};
    const messagesCol = collection(db, 'adminMessages');
    const q = query(messagesCol, where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toMillis() || Date.now(),
            }
        }) as AdminMessage[];

        messages.sort((a, b) => b.timestamp - a.timestamp);
        
        callback(messages);
    }, (error) => {
        console.error("Error listening to user admin messages:", error);
    });
    return unsubscribe;
}

async function getRiderByIdFromRiderDB(riderId: string): Promise<DocumentData | null> {
    if (!riderDb) {
        console.warn("Rider DB not configured.");
        return null;
    }
    await ensureRiderAuth();
    const riderRef = doc(riderDb, 'riders', riderId);
    const riderSnap = await getDoc(riderRef);
    if (riderSnap.exists()) {
        return riderSnap.data();
    }
    return null;
}

export function listenToRiderAppOrders(): () => void {
    if (!riderDb) {
        console.warn("Cannot listen to rider app orders: Rider DB not initialized.");
        return () => {};
    }

    let unsubscribeFromSnapshot: (() => void) | null = null;

    const setupListener = async () => {
        const riderUser = await ensureRiderAuth();
        if (!riderUser) {
            return; 
        }

        const riderOrdersCol = collection(riderDb, 'orders');
        unsubscribeFromSnapshot = onSnapshot(riderOrdersCol, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "modified") {
                    const riderOrderData = change.doc.data();
                    const orderId = change.doc.id;
                    const mainOrderRef = doc(db, 'orders', orderId);

                    try {
                        const mainOrderSnap = await getDoc(mainOrderRef);
                        if (!mainOrderSnap.exists()) {
                            // If order doesn't exist in the main DB, no need to sync.
                            return;
                        }

                        const mainOrderData = mainOrderSnap.data();
                        const updatePayload: { [key: string]: any } = {};

                        // Sync rider info if it has changed or is new
                        if (riderOrderData.riderId && mainOrderData.deliveryRiderId !== riderOrderData.riderId) {
                            updatePayload.deliveryRiderId = riderOrderData.riderId;
                            updatePayload.deliveryRiderName = riderOrderData.riderName || 'N/A';
                            
                            // Fetch rider details to get phone number
                            try {
                                const riderDetails = await getRiderByIdFromRiderDB(riderOrderData.riderId);
                                if (riderDetails && riderDetails.phone) {
                                    updatePayload.deliveryRiderPhone = riderDetails.phone;
                                }
                            } catch (riderError) {
                                console.error(`Failed to fetch rider details for ${riderOrderData.riderId}:`, riderError);
                            }
                        }
                        
                        // Sync status if it has changed
                        if (riderOrderData.status && mainOrderData.status !== riderOrderData.status) {
                            let newStatus = riderOrderData.status;
                            
                            // Standardize 'Completed' to 'Delivered'
                            if (newStatus === 'Completed') {
                                newStatus = 'Delivered';
                            }

                            updatePayload.status = newStatus;

                            // If status is now Delivered, remove confirmation code
                            if (newStatus === 'Delivered' && mainOrderData.deliveryConfirmationCode) {
                                updatePayload.deliveryConfirmationCode = deleteField();
                            }
                        }
                        
                        // If there's anything to update, perform the update
                        if (Object.keys(updatePayload).length > 0) {
                            await updateDoc(mainOrderRef, updatePayload);
                        }
                    } catch (error) {
                        console.error(`Failed to sync order ${orderId} from rider app:`, error);
                    }
                }
            });
        }, (error) => {
            console.error("Error listening to rider app orders:", error);
        });
    };

    setupListener();

    return () => {
        if (unsubscribeFromSnapshot) {
            unsubscribeFromSnapshot();
        }
    };
}


// --- Address Management ---
export async function getAddresses(userId: string): Promise<Address[]> {
    if (!userId) return [];
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const snapshot = await getDocs(addressesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Address[];
}

export async function addAddress(userId: string, addressData: Omit<Address, 'id'>): Promise<Address> {
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const docRef = await addDoc(addressesCol, addressData);
    const newAddress = { ...addressData, id: docRef.id } as Address;
    return newAddress;
}

export async function updateAddress(userId: string, updatedAddress: Address): Promise<void> {
    const { id, ...addressData } = updatedAddress;
    const docRef = doc(db, 'users', userId, 'addresses', id);
    await updateDoc(docRef, addressData);
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'addresses', addressId);
    await deleteDoc(docRef);
}

export async function setDefaultAddress(userId: string, addressIdToSetDefault: string): Promise<void> {
    try {
        await runTransaction(db, async (transaction) => {
            const addressesCol = collection(db, 'users', userId, 'addresses');
            const q = query(addressesCol, where('isDefault', '==', true));
            const currentDefaultSnapshot = await getDocs(q);

            currentDefaultSnapshot.forEach(docSnap => {
                transaction.update(docSnap.ref, { isDefault: false });
            });

            const newDefaultRef = doc(db, 'users', userId, 'addresses', addressIdToSetDefault);
            transaction.update(newDefaultRef, { isDefault: true });
        });
    } catch (e) {
        console.error("Set default address transaction failed: ", e);
    }
}

// --- Hero Section Management ---
export async function getHeroData(): Promise<HeroData> {
    const docRef = doc(db, 'globals', 'hero');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return defaultHeroData;
    }
    const data = docSnap.data();
    return { ...defaultHeroData, ...data } as HeroData;
}

export async function updateHeroData(data: HeroData): Promise<void> {
    const docRef = doc(db, 'globals', 'hero');
    await setDoc(docRef, data, { merge: true });
}

// --- Payment Settings Management ---
export async function getPaymentSettings(): Promise<PaymentSettings> {
    const docRef = doc(db, 'globals', 'paymentSettings');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, defaultPaymentSettings);
        return defaultPaymentSettings;
    }
    const data = docSnap.data();
    return { ...defaultPaymentSettings, ...data };
}

export async function updatePaymentSettings(data: Partial<PaymentSettings>): Promise<void> {
    const docRef = doc(db, 'globals', 'paymentSettings');
    await setDoc(docRef, data, { merge: true });
}

// --- Analytics Data ---
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
        
        const itemsCost = order.items.reduce((sum, item) => {
            const cost = item.costPrice ?? (item.price * 0.70);
            return sum + (cost * item.quantity);
        }, 0);
        
        const orderProfit = order.total - (order.totalTax || 0) - (order.deliveryFee || 0) - itemsCost;

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

// --- Admin Messaging & User Profile ---
export async function getAllUsers(): Promise<UserRef[]> {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email })) as UserRef[];
}

export async function getUserProfile(userId: string): Promise<DocumentData | null> {
    if (!userId) return null;
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() : null;
}

export async function updateUserProfileData(userId: string, data: { displayName?: string, mobileNumber?: string }): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error("Unauthorized. User is not logged in or mismatch.");
    }

    const dataToUpdate: { [key: string]: any } = {};
    if (data.displayName) {
        dataToUpdate.displayName = data.displayName;
    }
    if (data.mobileNumber) {
        dataToUpdate.mobileNumber = data.mobileNumber;
    }

    if (data.displayName && auth.currentUser.displayName !== data.displayName) {
        await auth.currentUser.updateProfile({ displayName: data.displayName });
    }

    if (Object.keys(dataToUpdate).length > 0) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, dataToUpdate, { merge: true });
    }
}

export async function getAdminMessages(): Promise<AdminMessage[]> {
    const messagesCol = collection(db, 'adminMessages');
    const q = query(messagesCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminMessage[];
}

export async function sendAdminMessage(userId: string, userEmail: string, title: string, message: string): Promise<void> {
    const messagesCol = collection(db, 'adminMessages');
    await addDoc(messagesCol, {
        userId,
        userEmail: userEmail || null,
        title,
        message,
        timestamp: serverTimestamp(),
    });
}

// --- Support Ticket Management ---
export async function sendSupportMessage(
    messageData: Omit<SupportTicket, 'id' | 'timestamp' | 'status'>
): Promise<void> {
  const supportCol = collection(db, 'supportTickets');
  await addDoc(supportCol, {
    ...messageData,
    timestamp: serverTimestamp(),
    status: 'Open',
  });
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
    const ticketsCol = collection(db, 'supportTickets');
    const q = query(ticketsCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toMillis() || Date.now(),
        }
    }) as SupportTicket[];
}

export function listenToSupportTickets(callback: (tickets: SupportTicket[]) => void): () => void {
    const ticketsCol = collection(db, 'supportTickets');
    const q = query(ticketsCol, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toMillis() || Date.now(),
            }
        }) as SupportTicket[];
        callback(tickets);
    }, (error) => {
        console.error("Error listening to support tickets:", error);
    });
    return unsubscribe;
}

export async function replyToSupportTicket(
    ticketId: string,
    userId: string,
    userEmail: string,
    replyText: string
): Promise<void> {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketRef, {
        status: 'Replied',
        reply: replyText,
        repliedAt: serverTimestamp(),
    });

    await sendAdminMessage(
        userId,
        userEmail,
        `Re: Your Support Ticket #${ticketId.slice(-6)}`,
        replyText
    );
}

export async function resolveSupportTicket(ticketId: string): Promise<void> {
    const docRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(docRef, { status: 'Resolved' });
}

// --- Other Data Functions ---
export async function getPopularDishes(): Promise<string[]> {
    const allItems = await getMenuItems();
    return allItems.filter(item => item.isPopular).map(item => item.name);
};

export const getCurrentTrends = (): string[] => {
  return ["Plant-based options", "Spicy food challenges", "Artisanal pizzas"];
};

