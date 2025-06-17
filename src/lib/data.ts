import type { Restaurant, MenuItem } from './types';

export const mockMenuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Margherita Pizza',
    description: 'Classic delight with 100% real mozzarella cheese',
    price: 12.99,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Pizza',
    isVegetarian: true,
    isPopular: true,
  },
  {
    id: 'm2',
    name: 'Pepperoni Pizza',
    description: 'A classic American favorite with spicy pepperoni',
    price: 15.50,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Pizza',
    isPopular: true,
  },
  {
    id: 'm3',
    name: 'Chicken Burger',
    description: 'Juicy chicken patty with fresh lettuce and secret sauce',
    price: 8.75,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Burgers',
  },
  {
    id: 'm4',
    name: 'Veggie Burger',
    description: 'Delicious veggie patty with all the fixings',
    price: 7.99,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Burgers',
    isVegetarian: true,
  },
  {
    id: 'm5',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, parmesan cheese, and croutons',
    price: 9.20,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Salads',
    isVegetarian: true,
  },
  {
    id: 'm6',
    name: 'Spaghetti Carbonara',
    description: 'Creamy pasta with bacon and parmesan',
    price: 14.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Pasta',
  },
  {
    id: 'm7',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a gooey center',
    price: 6.50,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Desserts',
    isVegetarian: true,
  },
  {
    id: 'm8',
    name: 'Butter Chicken',
    description: 'Tender chicken in a creamy tomato sauce',
    price: 16.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Indian',
  },
  {
    id: 'm9',
    name: 'Paneer Tikka Masala',
    description: 'Grilled paneer in a spiced curry sauce',
    price: 14.50,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Indian',
    isVegetarian: true,
    isPopular: true,
  },
  {
    id: 'm10',
    name: 'French Fries',
    description: 'Crispy golden french fries',
    price: 4.00,
    imageUrl: 'https://placehold.co/300x200.png',
    category: 'Sides',
    isVegetarian: true,
  },
];

export const mockRestaurants: Restaurant[] = [
  {
    id: 'r1',
    name: 'Pizza Palace',
    cuisine: 'Italian, Pizza',
    rating: 4.5,
    deliveryTime: '30-40 min',
    imageUrl: 'https://placehold.co/600x400.png',
    categories: ['Pizza', 'Italian', 'Fast Food'],
    menu: [mockMenuItems[0], mockMenuItems[1], mockMenuItems[4], mockMenuItems[6]],
    address: '123 Pizza St, Flavor Town',
    promotions: ['20% off on orders above $50'],
  },
  {
    id: 'r2',
    name: 'Burger Barn',
    cuisine: 'American, Burgers',
    rating: 4.2,
    deliveryTime: '25-35 min',
    imageUrl: 'https://placehold.co/600x400.png',
    categories: ['Burgers', 'American', 'Fast Food', 'Fries'],
    menu: [mockMenuItems[2], mockMenuItems[3], mockMenuItems[9]],
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
    menu: [mockMenuItems[7], mockMenuItems[8], mockMenuItems[4]],
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
    menu: [mockMenuItems[5], mockMenuItems[4], mockMenuItems[6]],
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
    menu: [mockMenuItems[6]],
    address: '222 Sugar Rush St, Candyland',
  },
];

export const getRestaurantById = (id: string): Restaurant | undefined => {
  return mockRestaurants.find(r => r.id === id);
};

export const getPopularDishes = (): string[] => {
  return mockMenuItems.filter(item => item.isPopular).map(item => item.name);
};

export const getCurrentTrends = (): string[] => {
  // Mock current trends
  return ["Plant-based options", "Spicy food challenges", "Artisanal pizzas"];
};

// Add data-ai-hint to image URLs
mockMenuItems.forEach(item => {
  item.imageUrl = `${item.imageUrl}?data-ai-hint=${item.name.split(" ")[0].toLowerCase()} ${item.category.toLowerCase()}`;
});

mockRestaurants.forEach(restaurant => {
  restaurant.imageUrl = `${restaurant.imageUrl}?data-ai-hint=${restaurant.name.split(" ")[0].toLowerCase()} ${restaurant.cuisine.split(",")[0].trim().toLowerCase()}`;
});
