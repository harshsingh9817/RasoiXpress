
import { NextResponse } from 'next/server';

// 🔹 Your preset destination
const PRESET = {
  name: "Rasoi Xpress Kitchen",
  lat: 25.970957,
  lon: 83.873759
};

// 🔹 Your OpenRouteService API key is read from environment variables
const ORS_KEY = process.env.ORS_API_KEY;

// 🔹 Default location context to improve geocoding for local village names
const DEFAULT_LOCATION_CONTEXT = "Nagra, Ballia, Uttar Pradesh";

// Utility: Geocoding helper with fallback
async function geocodeAddress(address: string) {
  // Append the default city/district context to make the search more specific
  const fullAddress = `${address}, ${DEFAULT_LOCATION_CONTEXT}`;
  const query = encodeURIComponent(fullAddress);

  // 1. Try Nominatim
  try {
    // The countrycodes=in parameter helps restrict searches to India
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=in`;
    const res1 = await fetch(nomUrl, {
      headers: { 'User-Agent': 'RasoiXpress/1.0 (support@example.com)' }
    });
    if (res1.ok) {
        const j1 = await res1.json();
        if (j1.length) {
            console.log("Geocoded via Nominatim:", j1[0]);
            return { lat: parseFloat(j1[0].lat), lon: parseFloat(j1[0].lon), source: 'nominatim' };
        }
    }
  } catch (e) {
      console.error("Nominatim geocoding failed:", e);
  }

  // 2. Fallback → Photon (also OSM-based, very good for Indian villages)
  try {
    // Bias the search towards the restaurant's location for better relevance
    const phoUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&lat=${PRESET.lat}&lon=${PRESET.lon}`;
    const res2 = await fetch(phoUrl);
     if (res2.ok) {
        const j2 = await res2.json();
        if (j2.features && j2.features.length) {
            const c = j2.features[0].geometry.coordinates;
            console.log("Geocoded via Photon fallback:", j2.features[0]);
            return { lon: c[0], lat: c[1], source: 'photon' };
        }
    }
  } catch(e) {
      console.error("Photon geocoding failed:", e);
  }

  // 3. If both fail → null
  return null;
}

// Main route handler for POST requests
export async function POST(request: Request) {
  if (!ORS_KEY) {
    console.error("OpenRouteService API key is not configured.");
    return NextResponse.json({ error: "Distance service is not configured on the server." }, { status: 500 });
  }

  try {
    let { address, lat, lon } = await request.json();

    // If coordinates are provided, use them directly. This is the most reliable method.
    if (!lat || !lon) {
      // If coordinates are not provided, try to geocode the address string.
      if (address) {
          const g = await geocodeAddress(address);
          if (!g) {
            return NextResponse.json({ error: "Address could not be found." }, { status: 404 });
          }
          lat = g.lat;
          lon = g.lon;
      } else {
        // If we have neither coordinates nor an address, it's a bad request.
        return NextResponse.json({ error: "Please provide 'address' or both 'lat' and 'lon'." }, { status: 400 });
      }
    }

    // Call the OpenRouteService API to get driving directions
    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?start=${lon},${lat}&end=${PRESET.lon},${PRESET.lat}`;
    
    const orsResponse = await fetch(orsUrl, {
      headers: {
        'Authorization': ORS_KEY,
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      }
    });

    if (!orsResponse.ok) {
      const errorText = await orsResponse.text();
      console.error("ORS API Error:", errorText);
      return NextResponse.json({ error: "Failed to calculate distance via routing service.", details: errorText }, { status: orsResponse.status });
    }

    const data = await orsResponse.json();
    const summary = data.features?.[0]?.properties?.summary;

    if (!summary) {
        return NextResponse.json({ error: "No route found between the locations." }, { status: 404 });
    }

    const dist_m = summary.distance;
    const dur_s = summary.duration;

    // Return a successful response with the calculated data
    return NextResponse.json({
      from: { lat, lon },
      to: PRESET,
      distance_m: Math.round(dist_m),
      distance_km: +(dist_m / 1000).toFixed(2),
      duration_min: +(dur_s / 60).toFixed(1),
      engine: 'openrouteservice'
    });

  } catch (err: any) {
    console.error("Distance API internal error:", err);
    return NextResponse.json({ error: err.message || "An internal server error occurred." }, { status: 500 });
  }
}
