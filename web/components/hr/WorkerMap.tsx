"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Pin {
  lat: number;
  lng: number;
  label: string;
  address: string;
  time: string;
}

interface GeoResult {
  displayName: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  road: string;
  country: string;
}

export default function WorkerMap({ pins }: { pins: Pin[] }) {
  const [geoData, setGeoData] = useState<Record<number, GeoResult | null>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  if (pins.length === 0) return null;

  const center: [number, number] = [pins[0].lat, pins[0].lng];

  const getAddressDetails = async (index: number, lat: number, lng: number) => {
    setLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        setGeoData((prev) => ({ ...prev, [index]: data }));
      } else {
        setGeoData((prev) => ({ ...prev, [index]: null }));
      }
    } catch {
      setGeoData((prev) => ({ ...prev, [index]: null }));
    }
    setLoading((prev) => ({ ...prev, [index]: false }));
  };

  return (
    <MapContainer center={center} zoom={12} style={{ height: "450px", width: "100%", borderRadius: "12px" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin, i) => (
        <Marker key={i} position={[pin.lat, pin.lng]} icon={icon}>
          <Popup minWidth={280} maxWidth={350}>
            <div style={{ fontFamily: "system-ui", padding: "4px 0" }}>
              {/* Worker name */}
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>
                📍 {pin.label}
              </div>

              {/* Declared address */}
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 2 }}>
                <strong>Declared:</strong> {pin.address || "No address declared"}
              </div>

              {/* GPS coordinates */}
              <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                GPS: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                {pin.time && ` • ${pin.time}`}
              </div>

              {/* Get Address Details button */}
              {!geoData[i] && (
                <button
                  onClick={() => getAddressDetails(i, pin.lat, pin.lng)}
                  disabled={loading[i]}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: loading[i] ? "#94A3B8" : "#3B82F6",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: loading[i] ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {loading[i] ? "⏳ Loading..." : "🔍 Get Address Details"}
                </button>
              )}

              {/* Address details result */}
              {geoData[i] && (
                <div style={{
                  marginTop: 8,
                  padding: 10,
                  backgroundColor: "#F0FDF4",
                  borderRadius: 8,
                  border: "1px solid #BBF7D0",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>
                    ✅ GPS Address Details:
                  </div>
                  <table style={{ width: "100%", fontSize: 11 }}>
                    <tbody>
                      {geoData[i]!.country && (
                        <tr><td style={{ color: "#64748B", paddingRight: 8, paddingBottom: 3 }}>Country:</td>
                          <td style={{ fontWeight: 600, color: "#1E293B", paddingBottom: 3 }}>{geoData[i]!.country}</td></tr>
                      )}
                      {geoData[i]!.province && geoData[i]!.province !== "Unknown" && (
                        <tr><td style={{ color: "#64748B", paddingRight: 8, paddingBottom: 3 }}>Province:</td>
                          <td style={{ fontWeight: 600, color: "#1E293B", paddingBottom: 3 }}>{geoData[i]!.province}</td></tr>
                      )}
                      {geoData[i]!.district && geoData[i]!.district !== "Unknown" && (
                        <tr><td style={{ color: "#64748B", paddingRight: 8, paddingBottom: 3 }}>District:</td>
                          <td style={{ fontWeight: 600, color: "#1E293B", paddingBottom: 3 }}>{geoData[i]!.district}</td></tr>
                      )}
                      {geoData[i]!.sector && geoData[i]!.sector !== "Unknown" && (
                        <tr><td style={{ color: "#64748B", paddingRight: 8, paddingBottom: 3 }}>Sector:</td>
                          <td style={{ fontWeight: 600, color: "#1E293B", paddingBottom: 3 }}>{geoData[i]!.sector}</td></tr>
                      )}
                      {geoData[i]!.cell && (
                        <tr><td style={{ color: "#64748B", paddingRight: 8, paddingBottom: 3 }}>Cell:</td>
                          <td style={{ fontWeight: 600, color: "#1E293B", paddingBottom: 3 }}>{geoData[i]!.cell}</td></tr>
                      )}
                      {geoData[i]!.road && (
                        <tr><td style={{ color: "#64748B", paddingRight: 8, paddingBottom: 3 }}>Street/Road:</td>
                          <td style={{ fontWeight: 600, color: "#1E293B", paddingBottom: 3 }}>{geoData[i]!.road}</td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* Full display name */}
                  <div style={{ marginTop: 6, fontSize: 10, color: "#64748B", borderTop: "1px solid #BBF7D0", paddingTop: 6 }}>
                    📌 {geoData[i]!.displayName}
                  </div>

                  {/* Refresh button */}
                  <button
                    onClick={() => { setGeoData((prev) => ({ ...prev, [i]: undefined as any })); }}
                    style={{
                      marginTop: 6,
                      padding: "4px 8px",
                      backgroundColor: "transparent",
                      color: "#3B82F6",
                      border: "1px solid #3B82F6",
                      borderRadius: 6,
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
              )}

              {/* Error state */}
              {geoData[i] === null && (
                <div style={{ marginTop: 8, padding: 8, backgroundColor: "#FEF2F2", borderRadius: 8, fontSize: 11, color: "#DC2626" }}>
                  ❌ Could not get address details. Try again.
                  <button
                    onClick={() => getAddressDetails(i, pin.lat, pin.lng)}
                    style={{ marginLeft: 8, color: "#3B82F6", cursor: "pointer", background: "none", border: "none", fontSize: 11, textDecoration: "underline" }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
