
"use client";

import { useState, useEffect, type FormEvent, type ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ListOrdered, MapPin, PackageSearch, Settings, User, Edit3, Trash2, PlusCircle, Loader2, LogOut,
  PackagePlus, ClipboardCheck, ChefHat, Truck, Bike, PackageCheck as PackageCheckIcon, AlertTriangle, XCircle, HomeIcon as AddressHomeIcon, Phone, Smartphone, CreditCard, Wallet, Camera, Ban, FileText, Info, Star
} from 'lucide-react';
import Image from 'next/image';
import type { Order, OrderItem, Address as AddressType, OrderStatus, Review } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { auth, storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';


const orderProgressSteps: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const stepIcons: Record<OrderStatus, React.ElementType> = {
  'Order Placed': PackagePlus,
  'Confirmed': ClipboardCheck,
  'Preparing': ChefHat,
  'Shipped': Truck,
  'Out for Delivery': Bike,
  'Delivered': PackageCheckIcon,
  'Cancelled': XCircle,
};

const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Want to change items in the order",
  "Delivery time is too long",
  "Found a better deal elsewhere",
  "Personal reasons",
  "Other (please specify if possible)",
];

const DELIVERY_FEE = 49.00;
const TAX_RATE = 0.05; // 5%


const initialMockOrders: Order[] = [
  {
    id: 'ORDNEW001',
    date: '2024-07-25',
    status: 'Order Placed',
    total: 899.00 + DELIVERY_FEE + (899.00 * TAX_RATE),
    items: [
      { id: 'm1', name: 'Margherita Pizza', quantity: 1, price: 349, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=margherita%20pizza', category: 'Pizza', description: 'Classic pizza' },
      { id: 'm4', name: 'Veggie Burger', quantity: 1, price: 220, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=veggie%20burgers', category: 'Burgers', description: 'Yummy veggie burger' },
      { id: 'm10', name: 'French Fries', quantity: 1, price: 120, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=french%20sides', category: 'Sides', description: 'Crispy fries' },
    ],
    shippingAddress: '777 New Order Ln, Fresh City',
    paymentMethod: 'UPI',
  },
  {
    id: 'ORD12345',
    date: '2024-07-15',
    status: 'Delivered',
    total: 1299 + (875*2) + DELIVERY_FEE + ((1299 + (875*2)) * TAX_RATE),
    items: [
      { id: 'm1', name: 'Margherita Pizza', quantity: 1, price: 1299, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=margherita%20pizza', category: 'Pizza', description: 'Classic pizza' },
      { id: 'm3', name: 'Chicken Burger', quantity: 2, price: 875, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=chicken%20burgers', category: 'Burgers', description: 'Juicy burger' },
    ],
    shippingAddress: '123 Main St, Anytown, USA',
    paymentMethod: 'UPI',
    review: { rating: 5, comment: 'Excellent pizza, very fast delivery!', date: '2024-07-16' }
  },
  {
    id: 'ORD67890',
    date: '2024-07-20',
    status: 'Preparing',
    total: 1600 + 400 + DELIVERY_FEE + ((1600+400) * TAX_RATE),
    items: [
      { id: 'm8', name: 'Butter Chicken', quantity: 1, price: 1600, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=butter%20indian', category: 'Indian', description: 'Creamy chicken' },
      { id: 'm10', name: 'French Fries', quantity: 1, price: 400, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=french%20sides', category: 'Sides', description: 'Crispy fries' },
    ],
    shippingAddress: '123 Main St, Anytown, USA',
    paymentMethod: 'Cash on Delivery',
  },
   {
    id: 'ORD11223',
    date: '2024-07-22',
    status: 'Shipped',
    total: 1400 + DELIVERY_FEE + (1400 * TAX_RATE),
    items: [ { id: 'm6', name: 'Spaghetti Carbonara', quantity: 1, price: 1400, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=spaghetti%20pasta', category: 'Pasta', description: 'Creamy pasta' }],
    shippingAddress: '456 Oak Ave, Anytown, USA',
    paymentMethod: 'UPI',
  },
  {
    id: 'ORDDELIVEREDNOREVIEW',
    date: '2024-07-23',
    status: 'Delivered',
    total: 920 + DELIVERY_FEE + (920*TAX_RATE),
    items: [{ id: 'm5', name: 'Caesar Salad', quantity: 1, price: 920, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=caesar%20salads', category: 'Salads', description: 'Crisp salad' }],
    shippingAddress: '789 Pine Ln, Anytown, USA',
    paymentMethod: 'UPI',
  },
  {
    id: 'ORDCANCELED',
    date: '2024-07-21',
    status: 'Cancelled',
    cancellationReason: "Ordered by mistake",
    total: 920 + DELIVERY_FEE + (920*TAX_RATE),
    items: [{ id: 'm5', name: 'Caesar Salad', quantity: 1, price: 920, imageUrl: 'https://placehold.co/100x100.png?data-ai-hint=caesar%20salads', category: 'Salads', description: 'Crisp salad' }],
    shippingAddress: '789 Pine Ln, Anytown, USA',
    paymentMethod: 'UPI',
  }
];

const initialMockAddresses: AddressType[] = [
  { id: 'addr1', type: 'Home', street: '123 Main St', city: 'Foodville', pinCode: '12345', phone: '555-0101', alternatePhone: '555-0102', isDefault: true },
  { id: 'addr2', type: 'Work', street: '456 Business Ave', city: 'Workville', pinCode: '67890', phone: '555-0201', isDefault: false },
];

const defaultAddressFormData: Omit<AddressType, 'id' | 'isDefault'> = {
  type: 'Home',
  street: '',
  city: '',
  pinCode: '',
  phone: '',
  alternatePhone: '',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user: firebaseUser, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [activeTab, setActiveTab] = useState('orders');
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackedOrderDetails, setTrackedOrderDetails] = useState<Order | null>(null);
  const [trackOrderError, setTrackOrderError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [isClientRendered, setIsClientRendered] = useState(false);

  // State for Address Dialog
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<AddressType | null>(null);
  const [currentAddressFormData, setCurrentAddressFormData] = useState<Omit<AddressType, 'id' | 'isDefault'>>(defaultAddressFormData);

  // State for Cancellation Dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>('');

  // State for Bill View Dialog
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [orderForBillView, setOrderForBillView] = useState<Order | null>(null);

  // State for Review Dialog
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState<Order | null>(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [currentReviewComment, setCurrentReviewComment] = useState('');


  useEffect(() => {
    setIsClientRendered(true);
    if (typeof window !== 'undefined') {
      const storedOrdersString = localStorage.getItem('rasoiExpressUserOrders');
      let loadedOrders: Order[] = initialMockOrders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          imageUrl: item.imageUrl.includes('data-ai-hint')
            ? item.imageUrl
            : `${item.imageUrl.split('?')[0]}?data-ai-hint=${item.name.split(" ")[0].toLowerCase()} ${item.category?.toLowerCase() || 'food'}`
        }))
      }));
      if (storedOrdersString) {
        try {
          const parsedOrders = JSON.parse(storedOrdersString) as Order[];
          if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
            loadedOrders = parsedOrders.map(order => ({
              ...order,
              items: order.items.map(item => ({
                ...item,
                imageUrl: item.imageUrl.includes('data-ai-hint')
                  ? item.imageUrl
                  : `${item.imageUrl.split('?')[0]}?data-ai-hint=${item.name.split(" ")[0].toLowerCase()} ${item.category?.toLowerCase() || 'food'}`
              }))
            }));
          }
        } catch (e) {
          console.error("Failed to parse orders from localStorage", e);
        }
      }
      setOrders(loadedOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id) ));


      const storedAddressesString = localStorage.getItem('rasoiExpressUserAddresses');
      if (storedAddressesString) {
        try {
          const parsedAddresses = JSON.parse(storedAddressesString) as AddressType[];
          if (Array.isArray(parsedAddresses) && parsedAddresses.length > 0) {
            setAddresses(parsedAddresses);
          } else {
             setAddresses(initialMockAddresses);
          }
        } catch (e) {
          console.error("Failed to parse addresses from localStorage", e);
          setAddresses(initialMockAddresses);
        }
      } else {
        setAddresses(initialMockAddresses);
      }
    }
  }, []);

  useEffect(() => {
    if (isClientRendered && !isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isClientRendered, isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (isClientRendered && typeof window !== 'undefined' && addresses.length > 0) {
      localStorage.setItem('rasoiExpressUserAddresses', JSON.stringify(addresses));
    }
  }, [addresses, isClientRendered]);
  
  useEffect(() => {
    if (isClientRendered && typeof window !== 'undefined' && orders.length > 0) {
        localStorage.setItem('rasoiExpressUserOrders', JSON.stringify(orders));
    }
  }, [orders, isClientRendered]);


  useEffect(() => {
    if (firebaseUser?.photoURL) {
      // console.log("ProfilePage: firebaseUser.photoURL updated to:", firebaseUser.photoURL);
    }
  }, [firebaseUser?.photoURL]);


  const findAndDisplayOrderStatus = (idToTrack: string) => {
    setTrackedOrderDetails(null);
    setTrackOrderError(null);

    if (!idToTrack) {
      setTrackOrderError('Please enter an order ID.');
      return;
    }
    const foundOrder = orders.find(o => o.id.toLowerCase() === idToTrack.toLowerCase());
    if (foundOrder) {
      setTrackedOrderDetails(foundOrder);
    } else {
      setTrackOrderError(`Order ${idToTrack} not found.`);
    }
  };

  const handleTrackOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    findAndDisplayOrderStatus(trackOrderId);
  };

  const handleTrackOrderFromList = (orderIdToList: string) => {
    setActiveTab('track');
    setTrackOrderId(orderIdToList);
    findAndDisplayOrderStatus(orderIdToList);
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'Delivered': return 'text-green-600';
      case 'Shipped':
      case 'Out for Delivery': return 'text-blue-600';
      case 'Preparing':
      case 'Confirmed': return 'text-yellow-600';
      case 'Order Placed': return 'text-sky-600';
      case 'Cancelled': return 'text-red-600';
      default: return 'text-orange-600';
    }
  };

  const handleSetDefaultAddress = (addressId: string) => {
    setAddresses(prevAddresses =>
      prevAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))
    );
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddresses(prevAddresses => prevAddresses.filter(addr => addr.id !== addressId));
  };

  const handleOpenAddAddressDialog = () => {
    setAddressToEdit(null);
    setCurrentAddressFormData(defaultAddressFormData);
    setIsAddressDialogOpen(true);
  };

  const handleOpenEditAddressDialog = (address: AddressType) => {
    setAddressToEdit(address);
    setCurrentAddressFormData({
      type: address.type,
      street: address.street,
      city: address.city,
      pinCode: address.pinCode,
      phone: address.phone,
      alternatePhone: address.alternatePhone || '',
    });
    setIsAddressDialogOpen(true);
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentAddressFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressTypeChange = (value: AddressType['type']) => {
    setCurrentAddressFormData(prev => ({ ...prev, type: value }));
  };

  const handleAddressFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (addressToEdit) {
      setAddresses(prev =>
        prev.map(addr =>
          addr.id === addressToEdit.id ? { ...addressToEdit, ...currentAddressFormData } : addr
        )
      );
    } else {
      const newAddress: AddressType = {
        id: `addr${Date.now()}`,
        ...currentAddressFormData,
        isDefault: addresses.length === 0,
      };
      setAddresses(prev => [...prev, newAddress]);
    }
    setIsAddressDialogOpen(false);
  };

  const handlePhotoEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) {
      setTimeout(() => {
        toast({ title: 'Invalid File Type', description: 'Please select an image file.', variant: 'destructive' });
      }, 0);
      return;
    }
    if (!firebaseUser || !auth.currentUser) {
      setTimeout(() => {
        toast({ title: 'Error', description: 'You must be logged in to change your profile photo.', variant: 'destructive' });
      }, 0);
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const filePath = `profileImages/${firebaseUser.uid}/${file.name}`;
      const imageRef = storageRef(storage, filePath);

      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true); 
      }
      
      setTimeout(() => {
        toast({ title: 'Profile Photo Updated!', description: 'Your new photo is now active.', variant: 'default' });
      }, 0);
    } catch (error: any) {
      console.error("Error uploading profile photo:", error);
      setTimeout(() => {
        toast({ title: 'Upload Failed', description: error.message || 'Could not update profile photo.', variant: 'destructive' });
      }, 0);
    } finally {
      setIsUploadingPhoto(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleOpenCancelDialog = (order: Order) => {
    if (order.status === 'Order Placed') {
      setOrderToCancel(order);
      setSelectedCancelReason('');
      setIsCancelDialogOpen(true);
    } else {
      setTimeout(() => {
        toast({
          title: 'Cancellation Not Allowed',
          description: 'This order can no longer be cancelled.',
          variant: 'destructive',
        });
      }, 0);
    }
  };

  const handleConfirmCancellation = () => {
    if (!orderToCancel) return;
    if (!selectedCancelReason) {
      setTimeout(() => {
        toast({
          title: 'Reason Required',
          description: 'Please select a reason for cancellation.',
          variant: 'destructive',
        });
      }, 0);
      return;
    }

    const orderIdToCancel = orderToCancel.id;
    const reasonForCancellation = selectedCancelReason;

    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderIdToCancel ? { ...o, status: 'Cancelled' as OrderStatus, cancellationReason: reasonForCancellation } : o
      )
    );
    setTimeout(() => {
      toast({
        title: 'Order Cancelled',
        description: `Order ${orderIdToCancel} has been successfully cancelled. Reason: ${reasonForCancellation}`,
        variant: 'default',
      });
    }, 0);
    setIsCancelDialogOpen(false);
    setOrderToCancel(null);
    setSelectedCancelReason('');
  };

  const handleOpenBillDialog = (order: Order) => {
    setOrderForBillView(order);
    setIsBillDialogOpen(true);
  };

  const calculateSubtotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleOpenReviewDialog = (order: Order) => {
    setOrderToReview(order);
    setCurrentRating(order.review?.rating || 0);
    setCurrentReviewComment(order.review?.comment || '');
    setIsReviewDialogOpen(true);
  };

  const handleReviewSubmit = () => {
    if (!orderToReview || currentRating === 0) {
      setTimeout(() => {
        toast({
          title: 'Rating Required',
          description: 'Please select a star rating.',
          variant: 'destructive',
        });
      }, 0);
      return;
    }

    const newReview: Review = {
      rating: currentRating,
      comment: currentReviewComment.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
    };

    const orderIdToReview = orderToReview.id;

    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderIdToReview ? { ...o, review: newReview } : o
      )
    );
    
    setTimeout(() => {
      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
        variant: 'default',
      });
    }, 0);

    setIsReviewDialogOpen(false);
    setOrderToReview(null);
  };


  if (!isClientRendered || isAuthLoading || (!isAuthenticated && isClientRendered)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isAuthLoading || !isClientRendered ? "Loading profile..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
       <section className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-8 p-6 bg-primary/5 rounded-xl shadow-xl border border-primary/20">
        <div className="relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/30 shadow-lg ring-2 ring-primary/20">
            <AvatarImage
              key={firebaseUser?.photoURL || 'default-avatar-key'}
              src={firebaseUser?.photoURL || `https://placehold.co/128x128.png?text=${firebaseUser?.displayName?.charAt(0) || firebaseUser?.email?.charAt(0) || 'U'}`}
              alt={firebaseUser?.displayName || 'User profile photo'}
              data-ai-hint="profile avatar"
            />
            <AvatarFallback className="text-4xl">
              {firebaseUser?.displayName?.charAt(0).toUpperCase() || firebaseUser?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-1 right-1 rounded-full bg-background/90 hover:bg-muted h-9 w-9 border-2 border-primary/30 shadow-md hover:border-primary/50"
            onClick={handlePhotoEditClick}
            aria-label="Edit profile photo"
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 text-primary/80" />}
          </Button>
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
            {firebaseUser?.displayName || firebaseUser?.email || 'Welcome, User!'}
          </h1>
          {firebaseUser?.displayName && <p className="text-lg text-muted-foreground mb-2">{firebaseUser?.email}</p>}
          <p className="text-md text-muted-foreground">
            Manage your orders, addresses, and account settings.
          </p>
        </div>
         <Button variant="outline" onClick={logout} className="mt-4 md:mt-0 md:ml-auto self-center md:self-start text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="orders"><ListOrdered className="mr-2 h-4 w-4 sm:hidden md:inline-block" />My Orders</TabsTrigger>
          <TabsTrigger value="addresses"><MapPin className="mr-2 h-4 w-4 sm:hidden md:inline-block" />My Addresses</TabsTrigger>
          <TabsTrigger value="track"><PackageSearch className="mr-2 h-4 w-4 sm:hidden md:inline-block" />Track Order</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4 sm:hidden md:inline-block" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline">Order History</CardTitle>
              <CardDescription>Review your past and current orders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {orders.length > 0 ? (
                orders.map(order => (
                  <Card key={order.id} className="bg-muted/30">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Order ID: {order.id}</CardTitle>
                          <CardDescription>
                            Date: {order.date} | Status: <span className={`font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
                            {order.status === 'Cancelled' && order.cancellationReason && (
                                <span className="text-xs block text-muted-foreground italic">Reason: {order.cancellationReason}</span>
                            )}
                          </CardDescription>
                        </div>
                        <p className="text-lg font-semibold text-primary">Rs.{order.total.toFixed(2)}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm font-medium">Items:</p>
                      <ul className="space-y-1">
                        {order.items.map(item => (
                          <li key={item.id + item.name} className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Image
                                src={item.imageUrl.includes('data-ai-hint') ? item.imageUrl.split('?data-ai-hint=')[0] : item.imageUrl.split('data-ai-hint=')[0]}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded mr-2"
                                data-ai-hint={item.imageUrl.includes('data-ai-hint=') ? item.imageUrl.split('data-ai-hint=')[1] : `${item.name.split(" ")[0].toLowerCase()} ${item.category?.toLowerCase() || 'food'}`}
                              />
                              <span>{item.name} (x{item.quantity})</span>
                            </div>
                            <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-muted-foreground pt-1">Shipped to: {order.shippingAddress}</p>
                      <div className="text-sm text-muted-foreground flex items-center">
                        Payment:
                        {order.paymentMethod === 'UPI' ? <CreditCard className="ml-2 mr-1 h-4 w-4 text-primary" /> : <Wallet className="ml-2 mr-1 h-4 w-4 text-primary" />}
                        {order.paymentMethod}
                      </div>

                       {order.review && (
                        <div className="pt-2 mt-2 border-t border-border">
                          <p className="text-sm font-medium">Your Review:</p>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn("h-4 w-4", i < order.review!.rating ? "fill-accent text-accent" : "text-muted-foreground")}
                              />
                            ))}
                            <span className="ml-2 text-xs text-muted-foreground">({order.review.rating}/5)</span>
                          </div>
                          {order.review.comment && <p className="text-xs text-muted-foreground italic mt-1">{order.review.comment}</p>}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-3 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleTrackOrderFromList(order.id)}
                        >
                          <PackageSearch className="mr-2 h-4 w-4" />
                          Track
                        </Button>
                         <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleOpenBillDialog(order)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Bill
                        </Button>
                        {order.status === 'Order Placed' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => handleOpenCancelDialog(order)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel Order
                          </Button>
                        )}
                        {order.status === 'Delivered' && !order.review && (
                           <Button
                            variant="default"
                            size="sm"
                            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                            onClick={() => handleOpenReviewDialog(order)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">You have no orders yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline">My Addresses</CardTitle>
              <CardDescription>Manage your saved shipping addresses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.map(address => (
                <Card key={address.id} className={cn("p-4", address.isDefault ? "border-primary ring-1 ring-primary" : "")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold flex items-center">
                        {address.type === 'Home' && <AddressHomeIcon className="mr-2 h-4 w-4 text-primary" />}
                        {address.type === 'Work' && <User className="mr-2 h-4 w-4 text-primary" />}
                        {address.type !== 'Home' && address.type !== 'Work' && <MapPin className="mr-2 h-4 w-4 text-primary" />}
                        {address.type} Address {address.isDefault && <span className="ml-2 text-xs text-primary font-bold">(Default)</span>}
                      </h4>
                      <p className="text-sm text-muted-foreground">{address.street}, {address.city}, {address.pinCode}</p>
                      <p className="text-sm text-muted-foreground"><Phone className="inline mr-1 h-3 w-3" />{address.phone}
                        {address.alternatePhone && <span className="ml-2"><Smartphone className="inline mr-1 h-3 w-3" />{address.alternatePhone}</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" aria-label="Edit address" onClick={() => handleOpenEditAddressDialog(address)}><Edit3 className="h-4 w-4" /></Button>
                      {!address.isDefault && <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete address" onClick={() => handleDeleteAddress(address.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                  {!address.isDefault && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary" onClick={() => handleSetDefaultAddress(address.id)}>Set as default</Button>
                  )}
                </Card>
              ))}
              <Button variant="outline" className="w-full mt-4" onClick={handleOpenAddAddressDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="track">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline">Track Your Order</CardTitle>
              <CardDescription>Enter your order ID to see its current status and progress.</CardDescription>
            </CardHeader>
            <form onSubmit={handleTrackOrderSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="e.g., ORD12345"
                    value={trackOrderId}
                    onChange={(e) => {
                      setTrackOrderId(e.target.value);
                      setTrackedOrderDetails(null);
                      setTrackOrderError(null);
                    }}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <PackageSearch className="mr-2 h-4 w-4" /> Track Order
                </Button>
              </CardContent>
            </form>
            <CardContent>
              {trackOrderError && (
                <p className="text-destructive text-center py-4">{trackOrderError}</p>
              )}
              {trackedOrderDetails && trackedOrderDetails.status === 'Cancelled' && (
                 <Card className="mt-4 border-destructive bg-destructive/10">
                    <CardHeader className="flex flex-row items-center space-x-3">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                        <div>
                            <CardTitle className="text-destructive">Order Cancelled</CardTitle>
                            <CardDescription>Order ID: {trackedOrderDetails.id} was cancelled.
                            {trackedOrderDetails.cancellationReason && <span className="block text-xs italic">Reason: {trackedOrderDetails.cancellationReason}</span>}
                            </CardDescription>
                        </div>
                    </CardHeader>
                 </Card>
              )}
              {trackedOrderDetails && trackedOrderDetails.status !== 'Cancelled' && (
                <div className="mt-6 space-y-6">
                  <div>
                     <h3 className="text-lg font-semibold mb-1">Order ID: {trackedOrderDetails.id}</h3>
                     <p className="text-sm text-muted-foreground">Current Status: <span className={cn("font-bold", getStatusColor(trackedOrderDetails.status))}>{trackedOrderDetails.status}</span></p>
                  </div>
                  <div className="relative pt-2">
                    <div className="absolute left-5 top-2 bottom-0 w-0.5 bg-border -z-10" />

                    {orderProgressSteps.map((step, index) => {
                      const IconComponent = stepIcons[step as OrderStatus] || PackageSearch;
                      const currentIndex = orderProgressSteps.indexOf(trackedOrderDetails.status);
                      const isCompleted = index < currentIndex;
                      const isActive = index === currentIndex;
                      const isFuture = index > currentIndex;

                      return (
                        <div key={step} className="flex items-start mb-5 last:mb-0">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border-2 shrink-0",
                            isActive ? "bg-primary border-primary text-primary-foreground animate-pulse" : "",
                            isCompleted ? "bg-primary/80 border-primary/80 text-primary-foreground" : "",
                            isFuture ? "bg-muted border-border text-muted-foreground" : ""
                          )}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="ml-4 pt-1.5">
                            <p className={cn(
                              "font-medium",
                              isActive ? "text-primary" : "",
                              isCompleted ? "text-foreground" : "",
                              isFuture ? "text-muted-foreground" : ""
                            )}>{step}</p>
                            {isActive && <p className="text-xs text-muted-foreground">This is the current step.</p>}
                            {isCompleted && <p className="text-xs text-muted-foreground">Completed</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-headline">Account Settings</CardTitle>
              <CardDescription>Manage your account preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={firebaseUser?.email || ''} disabled />
              </div>
               <div className="space-y-2">
                <Label>Full Name</Label>
                 <Input id="fullNameDisplay" type="text" value={firebaseUser?.displayName || 'N/A'} disabled />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Password</Label>
                <p className="text-sm text-muted-foreground">********</p>
                <Button variant="outline" size="sm" className="mt-1" disabled>Change Password (Not Implemented)</Button>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Notification Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input type="checkbox" id="promoEmails" defaultChecked />
                    <Label htmlFor="promoEmails" className="font-normal">Receive promotional emails</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input type="checkbox" id="orderUpdates" defaultChecked />
                    <Label htmlFor="orderUpdates" className="font-normal">Get order status updates</Label>
                  </div>
                </div>
                <Button variant="default" size="sm" className="mt-3 bg-primary hover:bg-primary/90">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Address Management Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{addressToEdit ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {addressToEdit ? 'Update your address details.' : 'Enter the details for your new address.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddressFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select
                  name="type"
                  value={currentAddressFormData.type}
                  onValueChange={(value: AddressType['type']) => handleAddressTypeChange(value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  name="street"
                  value={currentAddressFormData.street}
                  onChange={handleAddressFormChange}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={currentAddressFormData.city}
                    onChange={handleAddressFormChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pinCode">Pin Code</Label>
                  <Input
                    id="pinCode"
                    name="pinCode"
                    value={currentAddressFormData.pinCode}
                    onChange={handleAddressFormChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={currentAddressFormData.phone}
                  onChange={handleAddressFormChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alternatePhone">Alternate Phone Number (Optional)</Label>
                <Input
                  id="alternatePhone"
                  name="alternatePhone"
                  type="tel"
                  value={currentAddressFormData.alternatePhone}
                  onChange={handleAddressFormChange}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{addressToEdit ? 'Save Changes' : 'Add Address'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Cancellation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Order Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order <span className="font-semibold">{orderToCancel?.id}</span>?
              Please select a reason below. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="cancelReasonSelect">Reason for Cancellation</Label>
            <Select
              value={selectedCancelReason}
              onValueChange={setSelectedCancelReason}
            >
              <SelectTrigger id="cancelReasonSelect">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map(reason => (
                  <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>Keep Order</Button>
            <Button variant="destructive" onClick={handleConfirmCancellation} disabled={!selectedCancelReason}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Bill Dialog */}
      {orderForBillView && (
        <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" /> Order Bill: {orderForBillView.id}
              </DialogTitle>
              <DialogDescription>
                Date: {orderForBillView.date}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-2 text-sm">
              <div className="space-y-3 my-4">
                <h4 className="font-semibold text-base">Items:</h4>
                {orderForBillView.items.map(item => {
                  const itemTotal = item.price * item.quantity;
                  return (
                    <div key={item.id} className="flex justify-between items-center border-b pb-1">
                      <div>
                        <p>{item.name} (x{item.quantity})</p>
                        <p className="text-xs text-muted-foreground">@ Rs.{item.price.toFixed(2)} each</p>
                      </div>
                      <p>Rs.{itemTotal.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
              <Separator className="my-3"/>
              <div className="space-y-1.5 text-base">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>Rs.{calculateSubtotal(orderForBillView.items).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee:</span>
                  <span>Rs.{DELIVERY_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes ({(TAX_RATE * 100).toFixed(0)}%):</span>
                  <span>Rs.{(calculateSubtotal(orderForBillView.items) * TAX_RATE).toFixed(2)}</span>
                </div>
                 <Separator className="my-2"/>
                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Grand Total:</span>
                  <span>Rs.{orderForBillView.total.toFixed(2)}</span>
                </div>
              </div>
              <Separator className="my-3"/>
               <div className="space-y-1 text-sm mt-4">
                  <p className="font-semibold">Payment Method:</p>
                  <p className="text-muted-foreground">{orderForBillView.paymentMethod}</p>
                  <p className="font-semibold mt-2">Shipping Address:</p>
                  <p className="text-muted-foreground">{orderForBillView.shippingAddress}</p>
               </div>

            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsBillDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Dialog */}
      {orderToReview && (
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5 text-primary" /> Review Order: {orderToReview.id}
              </DialogTitle>
              <DialogDescription>
                Share your experience with this order.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label className="mb-2 block">Your Rating:</Label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <Star
                      key={starValue}
                      className={cn(
                        "h-8 w-8 cursor-pointer transition-colors",
                        starValue <= currentRating ? "fill-accent text-accent" : "text-muted-foreground hover:text-accent/70"
                      )}
                      onClick={() => setCurrentRating(starValue)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="reviewComment">Comments (Optional):</Label>
                <Textarea
                  id="reviewComment"
                  value={currentReviewComment}
                  onChange={(e) => setCurrentReviewComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleReviewSubmit} disabled={currentRating === 0}>
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
