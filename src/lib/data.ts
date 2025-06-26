
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
const initialMenuItems: Omit<MenuItem, 'id'>[] = [
  {
    name: 'Margherita Pizza',
    description: 'Classic delight with 100% real mozzarella cheese, fresh basil, and a tangy tomato sauce on a thin crust.',
    price: 349.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=margherita%20pizza',
    category: 'Pizza',
    isVegetarian: true,
    isPopular: true,
    weight: 'Approx. 450g',
    ingredients: 'Pizza dough, Mozzarella cheese, Tomato sauce, Fresh basil, Olive oil, Salt',
  },
  {
    name: 'Pepperoni Pizza',
    description: 'A classic American favorite with spicy pepperoni, mozzarella cheese, and our signature pizza sauce.',
    price: 429.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=pepperoni%20pizza',
    category: 'Pizza',
    isPopular: true,
    weight: 'Approx. 500g',
    ingredients: 'Pizza dough, Mozzarella cheese, Pepperoni, Tomato sauce, Oregano',
  },
  {
    name: 'Chicken Burger',
    description: 'Juicy grilled chicken patty with fresh lettuce, ripe tomatoes, onions, and our secret sauce in a toasted bun.',
    price: 249.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=chicken%20burgers',
    category: 'Burgers',
    weight: 'Approx. 280g',
    ingredients: 'Chicken patty, Burger bun, Lettuce, Tomato, Onion, Secret sauce, Pickles',
  },
  {
    name: 'Veggie Burger',
    description: 'A delicious and hearty veggie patty made with mixed vegetables and spices, served with all the fixings.',
    price: 220.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=veggie%20burgers',
    category: 'Burgers',
    isVegetarian: true,
    weight: 'Approx. 260g',
    ingredients: 'Veggie patty, Burger bun, Lettuce, Tomato, Onion, Mayonnaise',
  },
  {
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, Parmesan cheese, crunchy croutons, and a creamy Caesar dressing.',
    price: 275.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=caesar%20salads',
    category: 'Salads',
    isVegetarian: true,
    weight: 'Approx. 300g',
    ingredients: 'Romaine lettuce, Parmesan cheese, Croutons, Caesar dressing (contains anchovy extract for non-veg version)',
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with creamy egg yolk sauce, Pecorino Romano cheese, pancetta, and black pepper.',
    price: 399.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=spaghetti%20pasta',
    category: 'Pasta',
    weight: 'Approx. 350g',
    ingredients: 'Spaghetti, Pancetta, Egg yolks, Pecorino Romano cheese, Black pepper',
  },
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm, rich chocolate cake with a gooey, molten chocolate center. Served with a dusting of powdered sugar.',
    price: 180.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=chocolate%20desserts',
    category: 'Desserts',
    isVegetarian: true,
    weight: 'Approx. 150g',
    ingredients: 'Dark chocolate, Butter, Eggs, Sugar, Flour, Cocoa powder',
  },
  {
    name: 'Butter Chicken',
    description: 'Tender pieces of tandoori chicken cooked in a rich, creamy tomato and butter sauce, flavored with spices.',
    price: 450.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=butter%20indian',
    category: 'Indian',
    weight: 'Approx. 400g (with gravy)',
    ingredients: 'Chicken, Tomato, Cream, Butter, Ginger, Garlic, Spices (Garam masala, Turmeric, Cumin, Coriander)',
  },
  {
    name: 'Paneer Tikka Masala',
    description: 'Grilled cubes of paneer (Indian cottage cheese) simmered in a flavorful and aromatic spiced curry sauce.',
    price: 420.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=paneer%20indian',
    category: 'Indian',
    isVegetarian: true,
    isPopular: true,
    weight: 'Approx. 400g (with gravy)',
    ingredients: 'Paneer, Tomato, Onion, Cream, Ginger, Garlic, Capsicum, Spices (Garam masala, Turmeric, Cumin, Coriander, Kasuri methi)',
  },
  {
    name: 'French Fries',
    description: 'Crispy golden french fries, lightly salted. Perfect as a side or a snack.',
    price: 120.00,
    imageUrl: 'https://placehold.co/300x200.png?data-ai-hint=french%20sides',
    category: 'Sides',
    isVegetarian: true,
    weight: 'Approx. 150g',
    ingredients: 'Potatoes, Vegetable oil, Salt',
  },
];

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
    const q = query(ordersCol, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    if (!userId) return [];
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('userId', '==', userId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
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
    const q = query(messagesCol, where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminMessage[];
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
