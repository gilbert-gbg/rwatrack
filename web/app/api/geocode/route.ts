import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
    }

    // Call Nominatim (OpenStreetMap) reverse geocoding — FREE, no API key needed
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`;

    const res = await fetch(url, {
      headers: { "User-Agent": "RWATRACK-University-Project/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
    }

    const data = await res.json();
    const addr = data.address || {};

    // Map Nominatim fields to Rwanda administrative divisions
    const result = {
      // Full display name
      displayName: data.display_name || "Unknown location",

      // Rwanda administrative levels
      country: addr.country || "Rwanda",
      province: addr.state || addr.region || "Unknown",
      district: addr.county || addr.city || addr.town || "Unknown",
      sector: addr.suburb || addr.village || addr.town || addr.neighbourhood || "Unknown",
      cell: addr.neighbourhood || addr.hamlet || "",
      village: addr.hamlet || addr.isolated_dwelling || "",

      // Street details
      road: addr.road || addr.street || "",
      houseNumber: addr.house_number || "",

      // Coordinates
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),

      // Raw address object for debugging
      raw: addr,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to geocode location" }, { status: 500 });
  }
}
