// src/ai/flows/recommend-dishes.ts
'use server';

/**
 * @fileOverview A dish recommendation AI agent.
 *
 * - recommendDishes - A function that handles the dish recommendation process.
 * - RecommendDishesInput - The input type for the recommendDishes function.
 * - RecommendDishesOutput - The return type for the recommendDishes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendDishesInputSchema = z.object({
  userOrderHistory: z
    .string()
    .describe('A list of dishes the user has ordered in the past.'),
  popularDishes: z
    .string()
    .describe('A list of popular dishes in the user\u2019s area.'),
  currentTrends: z.string().describe('A list of current food trends.'),
});

export type RecommendDishesInput = z.infer<typeof RecommendDishesInputSchema>;

const RecommendDishesOutputSchema = z.object({
  recommendedDishes: z
    .string()
    .describe(
      'A list of recommended dishes the user has not tried before, based on their order history, popular dishes, and current trends.'
    ),
});

export type RecommendDishesOutput = z.infer<typeof RecommendDishesOutputSchema>;

export async function recommendDishes(
  input: RecommendDishesInput
): Promise<RecommendDishesOutput> {
  return recommendDishesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendDishesPrompt',
  input: {schema: RecommendDishesInputSchema},
  output: {schema: RecommendDishesOutputSchema},
  prompt: `You are a food recommendation expert. Based on the user's order history, popular dishes, and current trends, you will recommend dishes that the user has not tried before.

User Order History: {{{userOrderHistory}}}
Popular Dishes: {{{popularDishes}}}
Current Trends: {{{currentTrends}}}

Recommend dishes the user has not tried before from these categories. Do not recommend dishes that the user has already tried. Return a list of dishes.`,
});

const recommendDishesFlow = ai.defineFlow(
  {
    name: 'recommendDishesFlow',
    inputSchema: RecommendDishesInputSchema,
    outputSchema: RecommendDishesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
