
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Settings, User, Edit3, Trash2, PlusCircle, LogOut, HomeIcon as AddressHomeIcon, Phone, Smartphone, Bell, BellOff, Sun, Moon, Laptop } from 'lucide-react';
import type { Address as AddressType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/lib/data';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import { useTheme } from 'next-themes';

const defaultAddressFormData: Omit<AddressType, 'id' | 'isDefault'> = { fullName: '', type: 'Home', street: '', village: '', city: '', pinCode: '', phone: '', alternatePhone: '' };

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: firebaseUser, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('addresses');
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<AddressType | null>(null);
  const [currentAddressFormData, setCurrentAddressFormData] = useState<Omit<AddressType, 'id' | 'isDefault'>>(defaultAddressFormData);

  const loadUserData = useCallback(async () => {
    if (!firebaseUser) return;
    setIsDataLoading(true);
    try {
        const userAddresses = await getAddresses(firebaseUser.uid);
        setAddresses(userAddresses);
    } catch (error) {
        console.error("Failed to load user data:", error);
        toast({ title: "Error", description: "Could not load your profile data.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [firebaseUser, toast]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['addresses', 'settings'].includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
    } else {
        setActiveTab('addresses'); // Default to addresses
    }
  }, [isAuthenticated, isAuthLoading, router, searchParams]);

  useEffect(() => {
    if (isAuthenticated && firebaseUser) {
      loadUserData();
    }
  }, [isAuthenticated, firebaseUser, loadUserData]);

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!firebaseUser) return;
    await setDefaultAddress(firebaseUser.uid, addressId);
    await loadUserData();
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!firebaseUser) return;
    await deleteAddress(firebaseUser.uid, addressId);
    await loadUserData();
  };

  const handleOpenAddAddressDialog = () => {
    setAddressToEdit(null);
    setCurrentAddressFormData({...defaultAddressFormData, fullName: firebaseUser?.displayName || ''});
    setIsAddressDialogOpen(true);
  };

  const handleOpenEditAddressDialog = (address: AddressType) => {
    setAddressToEdit(address);
    setCurrentAddressFormData({ fullName: address.fullName, type: address.type, street: address.street, village: address.village || '', city: address.city, pinCode: address.pinCode, phone: address.phone, alternatePhone: address.alternatePhone || '' });
    setIsAddressDialogOpen(true);
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentAddressFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressTypeChange = (value: AddressType['type']) => {
    setCurrentAddressFormData(prev => ({ ...prev, type: value }));
  };

  const handleAddressFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (addressToEdit) {
      await updateAddress(firebaseUser.uid, { ...addressToEdit, ...currentAddressFormData });
    } else {
      const existingAddresses = await getAddresses(firebaseUser.uid);
      const newAddressData = { ...currentAddressFormData, isDefault: existingAddresses.length === 0 };
      await addAddress(firebaseUser.uid, newAddressData);
    }
    await loadUserData();
    setIsAddressDialogOpen(false);
  };
  
  const handleRequestNotificationPermission = () => {
    if (!('Notification' in window)) {
        toast({ title: "Unsupported Browser", description: "This browser does not support desktop notifications.", variant: "destructive" });
        return;
    }
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      if (permission === 'granted') toast({ title: 'Notifications Enabled!' });
      else if (permission === 'denied') toast({ title: 'Notifications Blocked', description: 'Please update your browser settings.', variant: 'destructive' });
    });
  };

  if (isAuthLoading || (isDataLoading && !addresses.length)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Loading profile..." : "Fetching your data..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
       <section className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-8 p-6 bg-primary/5 rounded-xl shadow-xl border border-primary/20">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/30 shadow-lg ring-2 ring-primary/20">
          <AvatarFallback className="text-4xl">{firebaseUser?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] animate-fade-in-up">
            {firebaseUser?.displayName || firebaseUser?.email}
          </h1>
          {firebaseUser?.displayName && <p className="text-lg text-muted-foreground mb-2">{firebaseUser?.email}</p>}
        </div>
        <Button variant="outline" onClick={logout} className="mt-4 md:mt-0 md:ml-auto self-center md:self-start text-destructive hover:bg-destructive/10 border-destructive/50"><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
      </section>

      <Tabs value={activeTab} onValueChange={(value) => router.push(`/profile?tab=${value}`, { scroll: false })} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="addresses"><MapPin className="mr-2 h-4 w-4 sm:hidden md:inline-block" />My Addresses</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4 sm:hidden md:inline-block" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="addresses">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>My Addresses</CardTitle><CardDescription>Manage your saved shipping addresses.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {addresses.map(address => (
                <Card key={address.id} className={cn("p-4", address.isDefault && "border-primary")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold flex items-center">
                         {address.type === 'Home' ? <AddressHomeIcon className="mr-2 h-4 w-4 text-primary" /> : <User className="mr-2 h-4 w-4 text-primary" />}
                         {address.type} Address {address.isDefault && <span className="ml-2 text-xs text-primary font-bold">(Default)</span>}
                      </h4>
                      <p className="font-medium text-base">{address.fullName}</p>
                      <p className="text-sm text-muted-foreground">{address.street}{address.village ? `, ${address.village}` : ''}, {address.city}, {address.pinCode}</p>
                      <p className="text-sm text-muted-foreground"><Phone className="inline mr-1 h-3 w-3" />{address.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenEditAddressDialog(address)}><Edit3 className="h-4 w-4" /></Button>
                      {!address.isDefault && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAddress(address.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                  {!address.isDefault && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary" onClick={() => handleSetDefaultAddress(address.id)}>Set as default</Button>
                  )}
                </Card>
              ))}
              <Button variant="outline" className="w-full mt-4" onClick={handleOpenAddAddressDialog}><PlusCircle className="mr-2 h-4 w-4" /> Add New Address</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Account Settings</CardTitle><CardDescription>Manage your account preferences.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label>Email</Label><Input value={firebaseUser?.email || ''} disabled /></div>
              <div className="space-y-2"><Label>Full Name</Label><Input value={firebaseUser?.displayName || 'N/A'} disabled /></div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Push Notifications</h4>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={handleRequestNotificationPermission} disabled={notificationPermission !== 'default'}>
                    {notificationPermission === 'granted' ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                    {notificationPermission === 'granted' ? 'Enabled' : 'Enable Notifications'}
                  </Button>
                  <p className="text-sm text-muted-foreground">{notificationPermission === 'denied' && "You have blocked notifications."}</p>
                </div>
              </div>
              <Separator />
               <div>
                <h4 className="font-medium mb-2">Appearance</h4>
                <p className="text-sm text-muted-foreground mb-4">
                    Select the theme for the application.
                </p>
                <RadioGroup
                    value={theme}
                    onValueChange={setTheme}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                    <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Sun className="mb-3 h-6 w-6" />
                        Light
                    </Label>
                    </div>
                    <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Moon className="mb-3 h-6 w-6" />
                        Dark
                    </Label>
                    </div>
                    <div>
                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                    <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                        <Laptop className="mb-3 h-6 w-6" />
                        System
                    </Label>
                    </div>
                </RadioGroup>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{addressToEdit ? 'Edit' : 'Add'} Address</DialogTitle></DialogHeader><form onSubmit={handleAddressFormSubmit}><div className="grid gap-4 py-4"><Input name="fullName" value={currentAddressFormData.fullName} onChange={handleAddressFormChange} required placeholder="Full Name" /><Select name="type" value={currentAddressFormData.type} onValueChange={handleAddressTypeChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Home">Home</SelectItem><SelectItem value="Work">Work</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select><Input name="street" value={currentAddressFormData.street} onChange={handleAddressFormChange} required placeholder="Street"/><Input name="village" value={currentAddressFormData.village || ''} onChange={handleAddressFormChange} placeholder="Village/Area (Optional)" /><Input name="city" value={currentAddressFormData.city} onChange={handleAddressFormChange} required placeholder="City" /><Input name="pinCode" value={currentAddressFormData.pinCode} onChange={handleAddressFormChange} required placeholder="Pin Code" /><Input name="phone" type="tel" value={currentAddressFormData.phone} onChange={handleAddressFormChange} required placeholder="Phone" /></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">{addressToEdit ? 'Save' : 'Add'}</Button></DialogFooter></form></DialogContent>
      </Dialog>
    </div>
  );
}
