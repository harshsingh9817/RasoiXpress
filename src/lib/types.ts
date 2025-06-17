
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  imageUrl: string;
  categories: string[];
  menu: MenuItem[];
  address: string; 
  promotions?: string[]; 
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string; 
  isVegetarian?: boolean;
  isPopular?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

// Added Order and OrderItem interfaces here to be globally accessible if needed
// Or ensure they are correctly defined/imported where used (e.g., ProfilePage, CheckoutPage)
export interface OrderItem extends MenuItem { // OrderItem can extend MenuItem
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress: string;
}

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}
