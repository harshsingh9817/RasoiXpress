
'use server';
/**
 * @fileOverview An AI flow to recommend dishes to users.
 * - recommendDishes - A function that generates dish recommendations.
 * - RecommendDishesInput - The input type for the recommendDishes function.
 * - RecommendDishesOutput - The return type for the recommendDishes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getMenuItems, getPopularDishes, getCurrentTrends } from '@/lib/data';

// For this example, we'll use mock data as if it were a user's history.
// In a real app, this would come from the user's session or a database.
const mockUserHistory = {
  favoriteCuisines: ['Italian'],
  previouslyOrdered: ['m1', 'm3'], // IDs of previously ordered menu items
};

export const RecommendDishesInputSchema = z.object({
  // In a real app, you'd pass user ID or history here.
  // For now, it's empty as we use mock data.
  userId: z.string().optional().describe('The ID of the user to get recommendations for.'),
});
export type RecommendDishesInput = z.infer<typeof RecommendDishesInputSchema>;

const RecommendationSchema = z.object({
  dishName: z.string().describe('The name of the recommended dish.'),
  restaurantName: z.string().describe('The name of the restaurant that serves this dish. Since we are item-focused, this can be "Rasoi Xpress".'),
  restaurantId: z.string().describe('The ID of the restaurant. Since we are item-focused, this can be a placeholder like "rasoi-xpress".'),
  reason: z.string().describe('A short, compelling reason why the user would like this dish.'),
  isNewToUser: z.boolean().describe('Set to true if this dish is something the user has not ordered before.'),
});

export const RecommendDishesOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema).describe('A list of up to 3 dish recommendations.'),
});
export type RecommendDishesOutput = z.infer<typeof RecommendDishesOutputSchema>;


export async function recommendDishes(input: RecommendDishesInput): Promise<RecommendDishesOutput> {
  return recommendDishesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendDishesPrompt',
  input: { schema: z.object({
    menuItems: z.string(),
    popularDishes: z.string(),
    currentTrends: z.string(),
    userHistory: z.string(),
  })},
  output: {schema: RecommendDishesOutputSchema},
  prompt: `You are a food recommendation expert for the food delivery app "Rasoi Xpress". Your goal is to provide personalized and exciting dish recommendations to a user.

Analyze the provided data:
1.  **Full Menu Data**: A JSON object of all available menu items.
2.  **User History**: A JSON object containing the user's favorite cuisines and a list of item IDs they have ordered before.
3.  **Popular Dishes**: A list of dishes that are popular across the platform.
4.  **Current Food Trends**: A list of current food trends to consider.

Your task is to generate exactly 3 recommendations for the user.

**Instructions**:
-   **Personalize**: Base your recommendations on the user's favorite cuisines.
-   **Promote Discovery**: Heavily prioritize recommending dishes the user **has not ordered before**. Use the \`previouslyOrdered\` list to determine this and set the \`isNewToUser\` flag accordingly.
-   **Be Specific**: For each recommendation, you must provide the exact dish name. For restaurant name, use "Rasoi Xpress". For restaurant ID, use "rasoi-xpress".
-   **Justify**: Provide a short, exciting, one-sentence reason for each recommendation. Make it sound appealing!
-   **Format**: Your final output must be a JSON object that strictly adheres to the provided output schema.

**DATA START**

**User History:**
\`\`\`json
{{{userHistory}}}
\`\`\`

**Popular Dishes:**
\`\`\`
{{{popularDishes}}}
\`\`\`

**Current Food Trends:**
\`\`\`
{{{currentTrends}}}
\`\`\`

**Full Menu Data:**
\`\`\`json
{{{menuItems}}}
\`\`\`

**DATA END**

Now, generate the 3 recommendations based on the data and instructions.`,
});

const recommendDishesFlow = ai.defineFlow(
  {
    name: 'recommendDishesFlow',
    inputSchema: RecommendDishesInputSchema,
    outputSchema: RecommendDishesOutputSchema,
  },
  async (input) => {
    // In a real app, you would fetch user history based on input.userId
    // For now, we use mock data.
    const userHistory = mockUserHistory;
    const popularDishes = await getPopularDishes();
    const trends = await getCurrentTrends();
    
    // We pass the full menu data to the model.
    const menuItems = await getMenuItems();

    const { output } = await prompt({
        userHistory: JSON.stringify(userHistory, null, 2),
        popularDishes: JSON.stringify(popularDishes, null, 2),
        currentTrends: JSON.stringify(trends, null, 2),
        menuItems: JSON.stringify(menuItems, null, 2),
    });

    if (!output) {
        // In case the model fails to return a structured response.
        return { recommendations: [] };
    }
    
    return output;
  }
);
