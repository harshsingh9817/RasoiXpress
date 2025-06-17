"use client";

import { useState, type FormEvent } from 'react';
import { recommendDishes, type RecommendDishesInput, type RecommendDishesOutput } from '@/ai/flows/recommend-dishes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CartSheet from '@/components/CartSheet'; // For layout consistency

export default function RecommendationsPage() {
  const [userOrderHistory, setUserOrderHistory] = useState('');
  const [popularDishes, setPopularDishes] = useState('');
  const [currentTrends, setCurrentTrends] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendDishesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setRecommendations(null);

    const input: RecommendDishesInput = {
      userOrderHistory,
      popularDishes,
      currentTrends,
    };

    try {
      const result = await recommendDishes(input);
      setRecommendations(result);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch recommendations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">
          AI Dish Recommendations <Sparkles className="inline-block h-8 w-8 text-accent" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Let our AI help you discover new dishes you'll love!
        </p>
      </section>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Tell Us Your Tastes</CardTitle>
          <CardDescription>
            Provide some information so our AI can suggest personalized dish recommendations. The more details, the better!
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userOrderHistory" className="text-base">Your Past Orders (comma-separated, e.g., Pizza, Pasta, Sushi)</Label>
              <Textarea
                id="userOrderHistory"
                value={userOrderHistory}
                onChange={(e) => setUserOrderHistory(e.target.value)}
                placeholder="e.g., Margherita Pizza, Chicken Burger, Caesar Salad"
                rows={3}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="popularDishes" className="text-base">Popular Dishes You Know (comma-separated)</Label>
              <Textarea
                id="popularDishes"
                value={popularDishes}
                onChange={(e) => setPopularDishes(e.target.value)}
                placeholder="e.g., Butter Chicken, Tacos, Ramen"
                rows={3}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentTrends" className="text-base">Current Food Trends You're Interested In (comma-separated)</Label>
              <Textarea
                id="currentTrends"
                value={currentTrends}
                onChange={(e) => setCurrentTrends(e.target.value)}
                placeholder="e.g., Plant-based meals, Fusion cuisine, Spicy challenges"
                rows={3}
                required
                className="text-base"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-lg py-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Getting Recommendations...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-5 w-5" /> Get Recommendations
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {recommendations && recommendations.recommendedDishes && (
        <Card className="shadow-lg animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-accent">
              <Sparkles className="inline-block mr-2 h-6 w-6" />
              Here Are Your AI-Powered Suggestions!
            </CardTitle>
            <CardDescription>
              Based on your input, we think you might enjoy these dishes:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-lg">
              {recommendations.recommendedDishes.split(',').map((dish, index) => (
                <li key={index} className="font-medium text-foreground">{dish.trim()}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <CartSheet />
    </div>
  );
}
