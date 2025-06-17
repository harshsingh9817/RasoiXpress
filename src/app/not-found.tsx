import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PackageSearch } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-4">
      <PackageSearch className="w-24 h-24 text-primary mb-6" />
      <h1 className="text-5xl font-bold font-headline text-primary mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Oops! The page you're looking for seems to have gone on a food adventure.
      </p>
      <Link href="/" passHref>
        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Back to Restaurants
        </Button>
      </Link>
    </div>
  )
}
