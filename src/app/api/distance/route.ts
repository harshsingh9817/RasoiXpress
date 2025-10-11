
import { NextResponse } from 'next/server';

const PRESET = {
  name: "Rasoi Xpress Kitchen",
  lat: 25.970957,
  lon: 83.873759
};

const ORS_API_KEY = "5b3ce3597851110001cf62487ee37f06934d4cb4a89624a112bec501";
const DEFAULT_LOCATION_CONTEXT = "Nagra, Ballia, Uttar Pradesh";

async function geocodeAddress(address: string) {
  const fullAddress = `${address}, ${DEFAULT_LOCATION_CONTEXT}`;
  const query = encodeURIComponent(fullAddress);
  console.log("🗺 Searching:", fullAddress);

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1&countrycodes=in`;
    const nomRes = await fetch(nomUrl, {
      headers: { "User-Agent": "RasoiXpress/1.0 (support@example.com)" }
    });
    const nomData = await nomRes.json();
    if (nomData.length) {
      console.log("✅ Found via Nominatim");
      return { lat: parseFloat(nomData[0].lat), lon: parseFloat(nomData[0].lon) };
    }
  } catch (e) {
    console.error("Nominatim error:", e);
  }

  try {
    const phoUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&lat=${PRESET.lat}&lon=${PRESET.lon}`;
    const phoRes = await fetch(phoUrl);
    const phoData = await phoRes.json();
    if (phoData.features && phoData.features.length) {
      console.log("✅ Found via Photon");
      const coords = phoData.features[0].geometry.coordinates;
      return { lat: coords[1], lon: coords[0] };
    }
  } catch (e) {
    console.error("Photon error:", e);
  }

  return null;
}


export async function POST(request: Request) {
  if (!ORS_API_KEY) {
    console.error("OpenRouteService API key is not configured.");
    return NextResponse.json({ error: "Distance service is not configured on the server." }, { status: 500 });
  }

  try {
    let { address, lat, lon } = await request.json();

    if (!lat || !lon) {
      if (address) {
          const g = await geocodeAddress(address);
          if (!g) {
            return NextResponse.json({ error: "Address could not be found." }, { status: 404 });
          }
          lat = g.lat;
          lon = g.lon;
      } else {
        return NextResponse.json({ error: "Please provide 'address' or both 'lat' and 'lon'." }, { status: 400 });
      }
    }

    const routeUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}`;
    const orsRes = await fetch(routeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates: [
          [lon, lat],
          [PRESET.lon, PRESET.lat]
        ]
      })
    });

    const orsData = await orsRes.json();

    if (!orsData.routes || !orsData.routes.length) {
        return NextResponse.json({ error: "No route found between the locations." }, { status: 404 });
    }

    const summary = orsData.routes[0].summary;

    return NextResponse.json({
      from: { lat, lon },
      to: PRESET,
      distance_m: Math.round(summary.distance),
      distance_km: +(summary.distance / 1000).toFixed(2),
      duration_min: +(summary.duration / 60).toFixed(1),
      engine: 'openrouteservice'
    });

  } catch (err: any) {
    console.error("Distance API internal error:", err);
    return NextResponse.json({ error: err.message || "An internal server error occurred." }, { status: 500 });
  }
}
