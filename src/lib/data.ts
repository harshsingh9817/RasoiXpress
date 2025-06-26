
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
} from 'firebase/firestore';
import { db } from './firebase';
import type { Restaurant, MenuItem, Order, Address, Review, HeroData, PaymentSettings, AnalyticsData, DailyChartData, AdminMessage, UserRef } from './types';

// --- Initial Data ---
const initialMenuItems: Omit<MenuItem, 'id'>[] = [];

const defaultHeroData: HeroData = {
    headline: 'Home Delivery In Nagra With Rasoi Xpress',
    subheadline: 'Browse our menu of curated dishes and get your favorites delivered to your door.',
};

const defaultPaymentSettings: PaymentSettings = {
    upiId: 'rasoixpress@okbank',
    qrCodeImageUrl: 'https://placehold.co/250x250.png?text=Scan+to+Pay'
};

async function initializeCollection(collectionName: string, initialData: any[]) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty) {
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
    const docRef = await addDoc(menuItemsCol, newItemData);
    const docSnap = await getDoc(docRef);
    return { id: docSnap.id, ...docSnap.data() } as MenuItem;
}

export async function updateMenuItem(updatedItem: MenuItem): Promise<void> {
    const { id, ...itemData } = updatedItem;
    const docRef = doc(db, 'menuItems', id);
    await updateDoc(docRef, itemData);
}

export async function deleteMenuItem(itemId: string): Promise<void> {
    const docRef = doc(db, 'menuItems', id);
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
    return { ...orderData, id: docRef.id } as Order;
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
}

export async function cancelOrder(orderId: string, reason: string): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { 
        status: 'Cancelled',
        cancellationReason: reason 
    });
}

export async function submitOrderReview(orderId: string, review: Review): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { review });
}

export async function getAllOrders(): Promise<Order[]> {
    const ordersCol = collection(db, 'orders');
    const snapshot = await getDocs(query(ordersCol, orderBy('date', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    if (!userId) return [];
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
    return userOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        await setDoc(docRef, defaultHeroData);
        return defaultHeroData;
    }
    return docSnap.data() as HeroData;
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
export async function getAnalyticsData(): Promise<AnalyticsData> {
    const orders = await getAllOrders();
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');

    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalProfit = totalRevenue * 0.30;
    const totalOrders = deliveredOrders.length;
    
    const dailyData: Map<string, { revenue: number; profit: number }> = new Map();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        dailyData.set(dateString, { revenue: 0, profit: 0 });
    }

    deliveredOrders.forEach(order => {
        const date = new Date(order.date).toISOString().split('T')[0];
        if (dailyData.has(date)) {
            const currentDay = dailyData.get(date)!;
            currentDay.revenue += order.total;
            currentDay.profit += order.total * 0.30;
            dailyData.set(date, currentDay);
        }
    });
    
    const chartData: DailyChartData[] = Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(a.date).getTime());

    return {
        totalRevenue,
        totalProfit,
        totalOrders,
        chartData,
    };
}

// --- Admin Messaging ---
export async function getAllUsers(): Promise<UserRef[]> {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email })) as UserRef[];
}

export async function getAdminMessages(): Promise<AdminMessage[]> {
    const messagesCol = collection(db, 'adminMessages');
    const q = query(messagesCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminMessage[];
}

export async function getUserAdminMessages(userId: string): Promise<AdminMessage[]> {
    if (!userId) return [];
    const messagesCol = collection(db, 'adminMessages');
    const q = query(messagesCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminMessage[];
    return messages.sort((a,b) => b.timestamp - a.timestamp);
}

export async function sendAdminMessage(userId: string, userEmail: string, title: string, message: string): Promise<void> {
    const messagesCol = collection(db, 'adminMessages');
    await addDoc(messagesCol, {
        userId,
        userEmail,
        title,
        message,
        timestamp: serverTimestamp(),
    });
}

// --- Other Data Functions ---
export async function getPopularDishes(): Promise<string[]> {
    const allItems = await getMenuItems();
    return allItems.filter(item => item.isPopular).map(item => item.name);
};

export const getCurrentTrends = (): string[] => {
  return ["Plant-based options", "Spicy food challenges", "Artisanal pizzas"];
};
