export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  imageUrl: string;
  categories: string[];
  menu: MenuItem[];
  address: string; // Added for Restaurant Details page
  promotions?: string[]; // Optional: for restaurant-specific promotions
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string; // e.g., "Appetizers", "Main Course", "Desserts"
  isVegetarian?: boolean;
  isPopular?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}
