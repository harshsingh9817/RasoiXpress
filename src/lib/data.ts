

import type { Restaurant, MenuItem, Order, Address, Review, HeroData, PaymentSettings } from './types';

// --- Key Constants ---
const allMenuItemsKey = 'rasoiExpressMenuItems';
const allOrdersKey = 'rasoiExpressAllOrders';
const userAddressesKeyPrefix = 'rasoiExpressUserAddresses_';
const heroDataKey = 'rasoiExpressHeroData';
const paymentSettingsKey = 'rasoiExpressPaymentSettings';


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
    backgroundImageUrl: 'https://placehold.co/1280x480.png'
};

const defaultPaymentSettings: PaymentSettings = {
    upiId: 'rasoixpress@okbank',
    qrCodeImageUrl: 'https://placehold.co/250x250.png?text=Scan+to+Pay'
};

// --- Helper Functions ---
function getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    try {
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.error(`Error parsing JSON from localStorage key "${key}":`, e);
        return defaultValue;
    }
}

function saveToStorage<T>(key: string, data: T) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key }));
}


// --- Menu Item Management ---
export function getMenuItems(): MenuItem[] {
    let items = getFromStorage<MenuItem[]>(allMenuItemsKey, []);
    if (items.length === 0) {
        items = initialMenuItems.map((item, index) => ({
            ...item,
            id: `m${index + 1}`
        }));
        saveToStorage(allMenuItemsKey, items);
    }
    return items.sort((a,b) => a.name.localeCompare(b.name));
}

export function addMenuItem(newItemData: Omit<MenuItem, 'id'>): MenuItem {
    const items = getMenuItems();
    const newItem: MenuItem = {
        ...newItemData,
        id: `m${Date.now()}`,
    };
    saveToStorage(allMenuItemsKey, [...items, newItem]);
    return newItem;
}

export function updateMenuItem(updatedItem: MenuItem): void {
    let items = getMenuItems();
    const index = items.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
        items[index] = updatedItem;
        saveToStorage(allMenuItemsKey, items);
    }
}

export function deleteMenuItem(itemId: string): void {
    let items = getMenuItems();
    items = items.filter(item => item.id !== itemId);
    saveToStorage(allMenuItemsKey, items);
}

// --- Restaurant Stubs ---
export function getRestaurants(): Restaurant[] { return []; }
export function getRestaurantById(id: string): Restaurant | undefined { return undefined; }

// --- Order Management ---
export function placeOrder(orderData: Omit<Order, 'id'>): Order {
    const allOrders = getFromStorage<Order[]>(allOrdersKey, []);
    const newOrder: Order = {
        ...orderData,
        id: `ORD${Date.now()}`,
    };
    saveToStorage(allOrdersKey, [...allOrders, newOrder]);
    return newOrder;
}

export function updateOrderStatus(orderId: string, status: Order['status']): void {
    const allOrders = getFromStorage<Order[]>(allOrdersKey, []);
    const index = allOrders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        allOrders[index].status = status;
        saveToStorage(allOrdersKey, allOrders);
    }
}

export function cancelOrder(orderId: string, reason: string): void {
    const allOrders = getFromStorage<Order[]>(allOrdersKey, []);
    const index = allOrders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        allOrders[index].status = 'Cancelled';
        allOrders[index].cancellationReason = reason;
        saveToStorage(allOrdersKey, allOrders);
    }
}

export function submitOrderReview(orderId: string, review: Review): void {
    const allOrders = getFromStorage<Order[]>(allOrdersKey, []);
    const index = allOrders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        allOrders[index].review = review;
        saveToStorage(allOrdersKey, allOrders);
    }
}

export function getAllOrders(): Order[] {
    return getFromStorage<Order[]>(allOrdersKey, []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// --- Address Management ---
export function getAddresses(userId: string): Address[] {
    return getFromStorage<Address[]>(`${userAddressesKeyPrefix}${userId}`, []);
}

export function addAddress(userId: string, addressData: Omit<Address, 'id'>): Address {
    const addresses = getAddresses(userId);
    const newAddress: Address = {
        ...addressData,
        id: `addr${Date.now()}`
    };
    saveToStorage(`${userAddressesKeyPrefix}${userId}`, [...addresses, newAddress]);
    return newAddress;
}

export function updateAddress(userId: string, updatedAddress: Address): void {
    let addresses = getAddresses(userId);
    const index = addresses.findIndex(addr => addr.id === updatedAddress.id);
    if (index !== -1) {
        addresses[index] = updatedAddress;
        saveToStorage(`${userAddressesKeyPrefix}${userId}`, addresses);
    }
}

export function deleteAddress(userId: string, addressId: string): void {
    let addresses = getAddresses(userId);
    addresses = addresses.filter(addr => addr.id !== addressId);
    saveToStorage(`${userAddressesKeyPrefix}${userId}`, addresses);
}

export function setDefaultAddress(userId: string, addressIdToSetDefault: string): void {
    const addresses = getAddresses(userId).map(addr => ({
        ...addr,
        isDefault: addr.id === addressIdToSetDefault
    }));
    saveToStorage(`${userAddressesKeyPrefix}${userId}`, addresses);
}

// --- Hero Section Management ---
export function getHeroData(): HeroData {
    return getFromStorage<HeroData>(heroDataKey, defaultHeroData);
}

export function updateHeroData(data: HeroData): void {
    saveToStorage(heroDataKey, data);
}

// --- Payment Settings Management ---
export function getPaymentSettings(): PaymentSettings {
    return getFromStorage<PaymentSettings>(paymentSettingsKey, defaultPaymentSettings);
}

export function updatePaymentSettings(data: PaymentSettings): void {
    saveToStorage(paymentSettingsKey, data);
}


// --- Other Data Functions ---
export function getPopularDishes(): string[] {
    return getMenuItems().filter(item => item.isPopular).map(item => item.name);
};

export const getCurrentTrends = (): string[] => {
  return ["Plant-based options", "Spicy food challenges", "Artisanal pizzas"];
};
