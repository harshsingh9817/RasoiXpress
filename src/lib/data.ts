
import type { Restaurant, MenuItem } from './types';

// --- LocalStorage Keys ---
const MENU_STORAGE_KEY = 'rasoiExpressAllMenuItems';
const RESTAURANTS_STORAGE_KEY = 'rasoiExpressAllRestaurants';

// --- Initial Data ---
const initialMenuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Margherita Pizza',
    description: 'Classic delight with 100% real mozzarella cheese, fresh basil, and a tangy tomato sauce on a thin crust.',
    price: 349.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Pizza',
    isVegetarian: true,
    isPopular: true,
    weight: 'Approx. 450g',
    ingredients: 'Pizza dough, Mozzarella cheese, Tomato sauce, Fresh basil, Olive oil, Salt',
  },
  {
    id: 'm2',
    name: 'Pepperoni Pizza',
    description: 'A classic American favorite with spicy pepperoni, mozzarella cheese, and our signature pizza sauce.',
    price: 429.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Pizza',
    isPopular: true,
    weight: 'Approx. 500g',
    ingredients: 'Pizza dough, Mozzarella cheese, Pepperoni, Tomato sauce, Oregano',
  },
  {
    id: 'm3',
    name: 'Chicken Burger',
    description: 'Juicy grilled chicken patty with fresh lettuce, ripe tomatoes, onions, and our secret sauce in a toasted bun.',
    price: 249.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Burgers',
    weight: 'Approx. 280g',
    ingredients: 'Chicken patty, Burger bun, Lettuce, Tomato, Onion, Secret sauce, Pickles',
  },
  {
    id: 'm4',
    name: 'Veggie Burger',
    description: 'A delicious and hearty veggie patty made with mixed vegetables and spices, served with all the fixings.',
    price: 220.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Burgers',
    isVegetarian: true,
    weight: 'Approx. 260g',
    ingredients: 'Veggie patty, Burger bun, Lettuce, Tomato, Onion, Mayonnaise',
  },
  {
    id: 'm5',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, Parmesan cheese, crunchy croutons, and a creamy Caesar dressing.',
    price: 275.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Salads',
    isVegetarian: true,
    weight: 'Approx. 300g',
    ingredients: 'Romaine lettuce, Parmesan cheese, Croutons, Caesar dressing (contains anchovy extract for non-veg version)',
  },
  {
    id: 'm6',
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with creamy egg yolk sauce, Pecorino Romano cheese, pancetta, and black pepper.',
    price: 399.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Pasta',
    weight: 'Approx. 350g',
    ingredients: 'Spaghetti, Pancetta, Egg yolks, Pecorino Romano cheese, Black pepper',
  },
  {
    id: 'm7',
    name: 'Chocolate Lava Cake',
    description: 'Warm, rich chocolate cake with a gooey, molten chocolate center. Served with a dusting of powdered sugar.',
    price: 180.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Desserts',
    isVegetarian: true,
    weight: 'Approx. 150g',
    ingredients: 'Dark chocolate, Butter, Eggs, Sugar, Flour, Cocoa powder',
  },
  {
    id: 'm8',
    name: 'Butter Chicken',
    description: 'Tender pieces of tandoori chicken cooked in a rich, creamy tomato and butter sauce, flavored with spices.',
    price: 450.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Indian',
    weight: 'Approx. 400g (with gravy)',
    ingredients: 'Chicken, Tomato, Cream, Butter, Ginger, Garlic, Spices (Garam masala, Turmeric, Cumin, Coriander)',
  },
  {
    id: 'm9',
    name: 'Paneer Tikka Masala',
    description: 'Grilled cubes of paneer (Indian cottage cheese) simmered in a flavorful and aromatic spiced curry sauce.',
    price: 420.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Indian',
    isVegetarian: true,
    isPopular: true,
    weight: 'Approx. 400g (with gravy)',
    ingredients: 'Paneer, Tomato, Onion, Cream, Ginger, Garlic, Capsicum, Spices (Garam masala, Turmeric, Cumin, Coriander, Kasuri methi)',
  },
  {
    id: 'm10',
    name: 'French Fries',
    description: 'Crispy golden french fries, lightly salted. Perfect as a side or a snack.',
    price: 120.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Sides',
    isVegetarian: true,
    weight: 'Approx. 150g',
    ingredients: 'Potatoes, Vegetable oil, Salt',
  },
];

const initialRestaurants: Restaurant[] = [
  {
    id: 'r1',
    name: 'Pizza Palace',
    cuisine: 'Italian, Pizza',
    rating: 4.5,
    deliveryTime: '30-40 min',
    imageUrl: 'https://placehold.co/600x400.png',
    categories: ['Pizza', 'Italian', 'Fast Food'],
    menu: [initialMenuItems[0], initialMenuItems[1], initialMenuItems[4], initialMenuItems[6]],
    address: '123 Pizza St, Flavor Town',
    promotions: ['20% off on orders above Rs.1000'],
  },
  {
    id: 'r2',
    name: 'Burger Barn',
    cuisine: 'American, Burgers',
    rating: 4.2,
    deliveryTime: '25-35 min',
    imageUrl: 'https://placehold.co/600x400.png',
    categories: ['Burgers', 'American', 'Fast Food', 'Fries'],
    menu: [initialMenuItems[2], initialMenuItems[3], initialMenuItems[9]],
    address: '456 Burger Ave, Grillsville',
  },
  {
    id: 'r3',
    name: 'Curry House',
    cuisine: 'Indian',
    rating: 4.8,
    deliveryTime: '40-50 min',
    imageUrl: 'https://placehold.co/600x400.png',
    categories: ['Indian', 'Curry', 'Vegetarian Options'],
    menu: [initialMenuItems[7], initialMenuItems[8], initialMenuItems[4]], // Added m4 Caesar Salad as a side
    address: '789 Spice Rd, Masala City',
    promotions: ['Free Naan with every main course'],
  },
  {
    id: 'r4',
    name: 'Pasta Perfection',
    cuisine: 'Italian, Pasta',
    rating: 4.0,
    deliveryTime: '35-45 min',
    imageUrl: 'https://placehold.co/600x400.png',
    categories: ['Pasta', 'Italian', 'Salads'],
    menu: [initialMenuItems[5], initialMenuItems[4], initialMenuItems[6]],
    address: '101 Noodle Ln, Roma',
  },
  {
    id: 'r5',
    name: 'Sweet Tooth Cafe',
    cuisine: 'Desserts, Bakery',
    rating: 4.6,
    deliveryTime: '20-30 min',
    imageUrl: 'https://placehold.co/600x400.png',
    categories: ['Desserts', 'Cakes', 'Coffee', 'Bakery'],
    menu: [initialMenuItems[6]],
    address: '222 Sugar Rush St, Candyland',
  },
];


// --- Helper Functions to get data, initializing from localStorage if available ---
function getData<T>(key: string, initialData: T): T {
    if (typeof window === 'undefined') {
        return initialData;
    }
    try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error(`Error parsing data from localStorage for key "${key}":`, error);
        localStorage.removeItem(key); // Clear corrupted data
    }
    // If no stored data or it's corrupted, set initial data and return it
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
}


// --- Menu Item Management ---
export function getMenuItems(): MenuItem[] {
    return getData(MENU_STORAGE_KEY, initialMenuItems);
}

export function addMenuItem(newItemData: Omit<MenuItem, 'id'>): MenuItem {
    const newId = `m${Date.now()}`;
    const newItem: MenuItem = { ...newItemData, id: newId };
    
    const currentItems = getMenuItems();
    const updatedItems = [...currentItems, newItem];
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(updatedItems));
    
    // Note: This doesn't add the item to any restaurant's menu automatically.
    // That would require a separate UI flow which is beyond the scope of this feature.
    return newItem;
}

export function updateMenuItem(updatedItem: MenuItem) {
    // Update master list
    const items = getMenuItems();
    const itemIndex = items.findIndex(item => item.id === updatedItem.id);
    if (itemIndex > -1) {
        items[itemIndex] = updatedItem;
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
    }
    
    // Update in any restaurant that has it
    const restaurants = getRestaurants();
    restaurants.forEach(restaurant => {
        const menuItemIndexInRestaurant = restaurant.menu.findIndex(item => item.id === updatedItem.id);
        if (menuItemIndexInRestaurant > -1) {
            restaurant.menu[menuItemIndexInRestaurant] = updatedItem;
        }
    });
    localStorage.setItem(RESTAURANTS_STORAGE_KEY, JSON.stringify(restaurants));
}

export function deleteMenuItem(itemId: string) {
    // Delete from master list
    const items = getMenuItems();
    const updatedItems = items.filter(item => item.id !== itemId);
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(updatedItems));

    // Delete from any restaurant that has it
    const restaurants = getRestaurants();
    restaurants.forEach(restaurant => {
        restaurant.menu = restaurant.menu.filter(item => item.id !== itemId);
    });
    localStorage.setItem(RESTAURANTS_STORAGE_KEY, JSON.stringify(restaurants));
}


// --- Restaurant Data Management ---
export function getRestaurants(): Restaurant[] {
    return getData(RESTAURANTS_STORAGE_KEY, initialRestaurants);
}

export function getRestaurantById(id: string): Restaurant | undefined {
  const restaurants = getRestaurants();
  // We now use the live version from localStorage (or initial data if not set)
  return restaurants.find(r => r.id === id);
}


// --- Other Data Functions ---
export const getPopularDishes = (): string[] => {
  return getMenuItems().filter(item => item.isPopular).map(item => item.name);
};

export const getCurrentTrends = (): string[] => {
  return ["Plant-based options", "Spicy food challenges", "Artisanal pizzas"];
};


// Add data-ai-hint to image URLs on initial data
[initialMenuItems, initialRestaurants.flatMap(r => r.menu)].flat().forEach(item => {
  if (item && item.imageUrl && !item.imageUrl.includes('data-ai-hint')) {
    const imageName = item.name.split(" ")[0].toLowerCase();
    const imageCategory = item.category.toLowerCase();
    item.imageUrl = `${item.imageUrl.split('?')[0]}?data-ai-hint=${imageName} ${imageCategory}`;
  }
});

initialRestaurants.forEach(restaurant => {
  if (restaurant && restaurant.imageUrl && !restaurant.imageUrl.includes('data-ai-hint')) {
    const restaurantName = restaurant.name.split(" ")[0].toLowerCase();
    const restaurantCuisine = restaurant.cuisine.split(",")[0].trim().toLowerCase();
    restaurant.imageUrl = `${restaurant.imageUrl.split('?')[0]}?data-ai-hint=${restaurantName} ${restaurantCuisine}`;
  }
});

// Original mock data exports, for cases where initial state might be needed without side effects
export const mockMenuItems: MenuItem[] = initialMenuItems;
export const mockRestaurants: Restaurant[] = initialRestaurants;
