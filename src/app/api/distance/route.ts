
import { NextResponse } from 'next/server';

// 🔹 Your preset destination
const PRESET = {
  name: "Rasoi Xpress Kitchen",
  lat: 25.970957,
  lon: 83.873759
};

// 🔹 Your OpenRouteService API key is read from environment variables
const ORS_KEY = process.env.ORS_API_KEY;

// Utility: Geocoding helper using OpenStreetMap's Nominatim service
async function geocodeAddress(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RasoiXpress/1.0 (support@example.com)' } // A unique user-agent is polite
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j || !j.length) return null;
    return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) };
  } catch (error) {
    console.error("Geocoding fetch error:", error);
    return null;
  }
}

// Main route handler for POST requests
export async function POST(request: Request) {
  if (!ORS_KEY) {
    console.error("OpenRouteService API key is not configured.");
    return NextResponse.json({ error: "Distance service is not configured on the server." }, { status: 500 });
  }

  try {
    let { address, lat, lon } = await request.json();

    // If coordinates are not provided, try to geocode the address
    if ((!lat || !lon) && address) {
      const g = await geocodeAddress(address);
      if (!g) {
        return NextResponse.json({ error: "Address could not be found." }, { status: 404 });
      }
      lat = g.lat;
      lon = g.lon;
    } else if (!lat || !lon) {
      // If we have neither coordinates nor an address, it's a bad request.
      return NextResponse.json({ error: "Please provide 'address' or both 'lat' and 'lon'." }, { status: 400 });
    }

    // Call the OpenRouteService API to get driving directions
    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?start=${lon},${lat}&end=${PRESET.lon},${PRESET.lat}`;
    
    const orsResponse = await fetch(orsUrl, {
      headers: {
        'Authorization': ORS_KEY,
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-ar'
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
