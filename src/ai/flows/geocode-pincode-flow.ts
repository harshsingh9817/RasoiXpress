
'use server';
/**
 * @fileOverview A Genkit flow to geocode a pin code using the OpenStreetMap Nominatim API.
 * - geocodePincode - Function to get location details from a pin code.
 * - GeocodePincodeInputSchema - The input type for the geocodePincode function.
 * - GeocodePincodeOutputSchema - The return type for the geocodePincode function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
    // Using OpenStreetMap's Nominatim API, which does not require an API key.
    // It's important to provide a descriptive User-Agent as per their usage policy.
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&postalcode=${pinCode}&country=india&addressdetails=1&limit=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RasoiExpressApp/1.0 (for app location feature)',
        },
        signal: controller.signal, // Add abort signal
      });
      clearTimeout(timeoutId); // Clear timeout if request succeeds or fails quickly

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Nominatim API request failed with status: ${response.status}`, errorText);
        return { error: `The location service is currently unavailable. Please try again later.` };
      }
      
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const address = result.address;

        let city = address.city || address.town || address.state_district;
        let locality = address.suburb || address.neighbourhood || address.city_district;

        // Fallback logic
        if (!city && locality) city = locality;
        if (!locality && city) locality = city;
        if (!city && !locality) city = address.state;

        return {
          city: city,
          locality: locality,
          fullAddress: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
      } else {
        console.warn(`Nominatim API returned no results for pin code: ${pinCode}`);
        return { error: `No location found for pin code ${pinCode}.` };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Error calling Nominatim API:", err);
      if (err.name === 'AbortError') {
        return { error: "The location service took too long to respond. Please try again." };
      }
      return { error: "Could not connect to the location service. Please check your network and try again." };
    }
  }
);
