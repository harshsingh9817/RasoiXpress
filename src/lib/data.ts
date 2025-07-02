
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
  Query,
  DocumentData,
  onSnapshot,
  deleteField,
} from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import type { Restaurant, MenuItem, Order, Address, Review, HeroData, PaymentSettings, AnalyticsData, DailyChartData, AdminMessage, UserRef, Rider, SupportTicket, BannerImage } from './types';

// --- Initial Data ---
const initialMenuItems: Omit<MenuItem, 'id'>[] = [];

const defaultBanners: BannerImage[] = [
    { src: 'https://placehold.co/1280x400.png', hint: 'pizza meal' },
    { src: 'https://placehold.co/1280x400.png', hint: 'indian thali' },
    { src: 'https://placehold.co/1280x400.png', hint: 'burger fries' },
    { src: 'https://placehold.co/1280x400.png', hint: 'chinese noodles' },
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
    
    // Firestore does not allow 'undefined' values.
    // We create a clean object that filters out any keys with an undefined value.
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
    // Convert the item data to a plain object to avoid issues with custom class instances
    const cleanData: { [key: string]: any } = JSON.parse(JSON.stringify(itemData));
    
    // Remove any keys with undefined, null, or empty string values before updating
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
        isAvailableForPickup: false, // Initialize as false
    });

    // After successfully adding the order, update the user's first order status flag.
    const userRef = doc(db, "users", orderData.userId);
    try {
        const userDoc = await getDoc(userRef);
        // We only update the flag if it's currently false.
        if (userDoc.exists() && userDoc.data()?.hasCompletedFirstOrder === false) {
            await updateDoc(userRef, { hasCompletedFirstOrder: true });
        }
    } catch (error) {
        // Log this error but don't fail the order placement, as it's not critical.
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
    const dataToUpdate: Record<string, any> = { status };

    if (status === 'Out for Delivery') {
        // This makes the order available for riders when admin sets this status.
        dataToUpdate.isAvailableForPickup = true;
    } else if (status === 'Delivered') {
        dataToUpdate.deliveryConfirmationCode = deleteField();
        dataToUpdate.isAvailableForPickup = false;
    } else if (status === 'Cancelled') {
        dataToUpdate.isAvailableForPickup = false;
    }
    // Note: 'isAvailableForPickup' is NOT changed for 'Confirmed' or 'Preparing' statuses anymore.
    // It's set to 'false' inside `acceptOrderForDelivery` when a rider takes the job.
    
    await updateDoc(docRef, dataToUpdate);
}

export async function acceptOrderForDelivery(orderId: string, riderId: string, riderName: string): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    try {
        await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) {
                throw "Order does not exist.";
            }

            const orderData = orderDoc.data();
            if (orderData.deliveryRiderId) {
                throw "This order has already been accepted by another rider.";
            }
            if (!orderData.isAvailableForPickup) {
                 throw "This order is no longer available for pickup.";
            }

            transaction.update(orderRef, {
                status: 'Out for Delivery',
                deliveryRiderId: riderId,
                deliveryRiderName: riderName,
                isAvailableForPickup: false,
            });
        });
    } catch (e: any) {
        console.error("Accept order transaction failed: ", e);
        // Re-throw the error to be caught by the calling component
        throw new Error(e.message || e);
    }
}


export async function cancelOrder(orderId: string, reason: string): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { 
        status: 'Cancelled',
        cancellationReason: reason,
        isAvailableForPickup: false,
    });
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
    // Removed orderBy to avoid needing a composite index. Sorting will be done on the client.
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

        // Sort messages on the client by timestamp, newest first.
        messages.sort((a, b) => b.timestamp - a.timestamp);
        
        callback(messages);
    }, (error) => {
        console.error("Error listening to user admin messages:", error);
    });
    return unsubscribe;
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
    return { ...addressData, id: docRef.id } as Address;
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
    return docSnap.data() as PaymentSettings;
}

export async function updatePaymentSettings(data: PaymentSettings): Promise<void> {
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

    // Calculate total profit and daily data based on delivered orders
    let totalProfit = 0;
    deliveredOrders.forEach(order => {
        const date = new Date(order.date).toISOString().split('T')[0];
        const dayData = dailyData.get(date) || { revenue: 0, profit: 0, loss: 0 };
        
        // For each item, use its costPrice if available, otherwise estimate it as 70% of the selling price
        const itemsCost = order.items.reduce((sum, item) => {
            const cost = item.costPrice ?? (item.price * 0.70); // Fallback to 30% margin estimate
            return sum + (cost * item.quantity);
        }, 0);
        
        // Profit = (Total Revenue from customer) - (Taxes) - (Delivery Fee) - (Cost of Goods)
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

// --- Admin Messaging ---
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

// --- Rider Management ---
export async function getRiders(): Promise<Rider[]> {
    const ridersCol = collection(db, 'riders');
    const snapshot = await getDocs(query(ridersCol, orderBy("fullName")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Rider[];
}

export async function getRiderEmails(): Promise<string[]> {
    const ridersCol = collection(db, 'riders');
    const snapshot = await getDocs(ridersCol);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data().email as string);
}

export async function addRider(fullName: string, email: string, phone: string, password?: string): Promise<void> {
    const ridersCol = collection(db, 'riders');
    const lowercasedEmail = email.toLowerCase();
    
    const riderQuery = query(ridersCol, where("email", "==", lowercasedEmail));
    const riderSnapshot = await getDocs(riderQuery);
    if (!riderSnapshot.empty) {
        throw new Error("A rider with this email already exists in the delivery team.");
    }
    
    if (password) {
        let secondaryApp;
        try {
            const appName = `rider-creation-${Date.now()}`;
            secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, lowercasedEmail, password);
            const { user } = userCredential;
            
            await updateProfile(user, { displayName: fullName });
            
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: fullName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                mobileNumber: phone,
                hasCompletedFirstOrder: false,
                isDelivery: true
            });

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                 throw new Error("A user account with this email already exists.");
            } else if (error.code === 'auth/weak-password') {
                throw new Error("Password is too weak. It must be at least 6 characters long.");
            }
            console.error("Error creating rider auth user:", error);
            throw new Error(error.message || "Could not create the rider's user account.");
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
        }
    }
    
    await addDoc(ridersCol, { fullName, email: lowercasedEmail, phone });
}


export async function deleteRider(riderId: string): Promise<void> {
    const docRef = doc(db, 'riders', riderId);
    await deleteDoc(docRef);
}

export async function clearRiderDeliveryCount(riderId: string): Promise<void> {
    const docRef = doc(db, 'riders', riderId);
    await updateDoc(docRef, {
        lastPaymentDate: serverTimestamp()
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
