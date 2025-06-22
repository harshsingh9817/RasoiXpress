
import type { Restaurant, MenuItem, Order, Address } from './types';
import { db } from './firebase';
import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    query,
    orderBy
} from 'firebase/firestore';


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


// --- Menu Item Management ---
const menuItemsCollection = collection(db, 'menuItems');

async function seedInitialData() {
    const snapshot = await getDocs(menuItemsCollection);
    if (snapshot.empty) {
        console.log("No menu items found. Seeding initial data...");
        const batch = writeBatch(db);
        initialMenuItems.forEach(item => {
            const docRef = doc(menuItemsCollection); // Auto-generates an ID
            batch.set(docRef, item);
        });
        await batch.commit();
        console.log("Initial data seeded.");
    }
}

export async function getMenuItems(): Promise<MenuItem[]> {
    await seedInitialData();
    const q = query(menuItemsCollection, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
}

export async function addMenuItem(newItemData: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const docRef = await addDoc(menuItemsCollection, newItemData);
    return { id: docRef.id, ...(newItemData as MenuItem) };
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


// --- Restaurant Data Management (Kept for compatibility, but not primary focus) ---
export async function getRestaurants(): Promise<Restaurant[]> {
    // In a real scenario, you'd fetch from a 'restaurants' collection.
    // For now, returning an empty array as per the app's current focus.
    return [];
}

export async function getRestaurantById(id: string): Promise<Restaurant | undefined> {
    const restaurants = await getRestaurants();
    return restaurants.find(r => r.id === id);
}


// --- Order Management ---
const ordersCollection = collection(db, 'orders');

export async function placeOrder(orderData: Omit<Order, 'id'>): Promise<Order> {
    const docRef = await addDoc(ordersCollection, orderData);
    return { id: docRef.id, ...orderData };
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
}

export async function cancelOrder(orderId: string, reason: string): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status: 'Cancelled', cancellationReason: reason });
}

export async function submitOrderReview(orderId: string, review: Order['review']): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { review });
}

export async function getAllOrders(): Promise<Order[]> {
    const q = query(ordersCollection, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

// --- Address Management ---
function getAddressesCollection(userId: string) {
    return collection(db, 'users', userId, 'addresses');
}

export async function getAddresses(userId: string): Promise<Address[]> {
    const snapshot = await getDocs(getAddressesCollection(userId));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
}

export async function addAddress(userId: string, addressData: Omit<Address, 'id'>): Promise<Address> {
    const docRef = await addDoc(getAddressesCollection(userId), addressData);
    return { id: docRef.id, ...addressData };
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
    const addresses = await getAddresses(userId);
    const batch = writeBatch(db);
    addresses.forEach(addr => {
        const docRef = doc(db, 'users', userId, 'addresses', addr.id);
        batch.update(docRef, { isDefault: addr.id === addressIdToSetDefault });
    });
    await batch.commit();
}


// --- Other Data Functions ---
export async function getPopularDishes(): Promise<string[]> {
    const menuItems = await getMenuItems();
    return menuItems.filter(item => item.isPopular).map(item => item.name);
};

export const getCurrentTrends = (): string[] => {
  return ["Plant-based options", "Spicy food challenges", "Artisanal pizzas"];
};
