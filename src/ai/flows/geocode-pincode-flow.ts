
'use server';
/**
 * @fileOverview A Genkit flow to geocode a pin code using Google Maps API.
 * - geocodePincode - Function to get location details from a pin code.
 * - GeocodePincodeInputSchema - The input type for the geocodePincode function.
 * - GeocodePincodeOutputSchema - The return type for the geocodePincode function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// IMPORTANT: You need to set GOOGLE_MAPS_API_KEY in your .env file for this to work.
// Ensure the Geocoding API is enabled in your Google Cloud project.
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const GeocodePincodeInputSchema = z.object({
  pinCode: z.string().length(6, { message: "Pin code must be 6 digits" }).regex(/^\d{6}$/, { message: "Pin code must be 6 digits" }),
});
export type GeocodePincodeInput = z.infer<typeof GeocodePincodeInputSchema>;

export const GeocodePincodeOutputSchema = z.object({
  city: z.string().optional(),
  locality: z.string().optional(),
  fullAddress: z.string().optional(),
  error: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type GeocodePincodeOutput = z.infer<typeof GeocodePincodeOutputSchema>;

export async function geocodePincode(input: GeocodePincodeInput): Promise<GeocodePincodeOutput> {
  return geocodePincodeFlow(input);
}

const geocodePincodeFlow = ai.defineFlow(
  {
    name: 'geocodePincodeFlow',
    inputSchema: GeocodePincodeInputSchema,
    outputSchema: GeocodePincodeOutputSchema,
  },
  async ({ pinCode }) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("GOOGLE_MAPS_API_KEY is not set in .env file.");
      return { error: "Server configuration error: Missing API key." };
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${pinCode}&key=${GOOGLE_MAPS_API_KEY}&components=country:IN`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Geocoding API request failed with status: ${response.status}`, errorData);
        return { error: `Geocoding service request failed. Status: ${response.status}. ${errorData.error_message || ''}`.trim() };
      }
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        const location = result.geometry.location;
        let city: string | undefined;
        let locality: string | undefined;

        // Extract city: typically administrative_area_level_2 or locality
        const cityComponent = addressComponents.find((comp: any) => comp.types.includes('administrative_area_level_2')) ||
                              addressComponents.find((comp: any) => comp.types.includes('locality'));
        city = cityComponent?.long_name;

        // Extract locality: typically sublocality_level_1, sublocality, or locality if it's more specific than the city
        const sublocalityComponentL1 = addressComponents.find((comp: any) => comp.types.includes('sublocality_level_1'));
        const sublocalityComponent = addressComponents.find((comp: any) => comp.types.includes('sublocality'));
        const localityComponentFromAPI = addressComponents.find((comp: any) => comp.types.includes('locality'));

        if (sublocalityComponentL1) {
          locality = sublocalityComponentL1.long_name;
        } else if (sublocalityComponent) {
          locality = sublocalityComponent.long_name;
        } else if (localityComponentFromAPI && localityComponentFromAPI.long_name !== city) {
          // Use locality if it's different from the determined city
          locality = localityComponentFromAPI.long_name;
        }


        // Fallback logic
        if (!city && locality) city = locality; // If city is missing, use locality as city
        if (!locality && city) locality = city; // If locality is missing, use city as locality

        return {
          city: city,
          locality: locality, // This will be the more specific area name if found
          fullAddress: result.formatted_address,
          lat: location.lat,
          lng: location.lng,
        };
      } else {
        console.warn(`Geocoding API returned status: ${data.status}. Message: ${data.error_message || 'No results'}`);
        return { error: data.error_message || `No location found for pin code ${pinCode}. Status: ${data.status}` };
      }
    } catch (err: any) {
      console.error("Error calling Geocoding API:", err);
      return { error: "Failed to fetch location data. " + err.message };
    }
  }
);
