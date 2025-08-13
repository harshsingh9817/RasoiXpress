
import Link from "next/link";
import RasoiXpressLogo from "./icons/RasoiXpressLogo";

const Footer = () => {
    return (
        <footer className="bg-card border-t mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <RasoiXpressLogo />
                        <p className="text-sm text-muted-foreground">
                            Your favorite local food, delivered fast.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-card-foreground">Quick Links</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="/" className="text-muted-foreground hover:text-primary">Menu</Link></li>
                            <li><Link href="/my-orders" className="text-muted-foreground hover:text-primary">My Orders</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-card-foreground">Legal & Info</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="/about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                            <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact Us</Link></li>
                            <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                            <li><Link href="/terms-and-conditions" className="text-muted-foreground hover:text-primary">Terms & Conditions</Link></li>
                            <li><Link href="/refund-and-cancellation" className="text-muted-foreground hover:text-primary">Refund & Cancellation</Link></li>
                            <li><Link href="/shipping-and-delivery" className="text-muted-foreground hover:text-primary">Shipping & Delivery</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Rasoi Xpress. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
