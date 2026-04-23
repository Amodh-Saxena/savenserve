import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Navigation, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    mappls: any;
  }
}

interface NgoMapProps {
  ngos: any[]; // The list of NGOs to display
}

interface UserLocation {
  lat: number;
  lng: number;
}

export default function NgoMap({ ngos }: NgoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapObject, setMapObject] = useState<any>(null);
  const [userLoc, setUserLoc] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef<{ [key: string]: any }>({});
  const mapInitialized = useRef(false);

  // 1. Get User Location (Coordinates)
  useEffect(() => {
    const fetchLocation = async () => {
      // Prompt user for HTML5 Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLoc({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          async (err) => {
            console.warn("Geolocation denied or failed. Falling back to IP-based location...", err);
            // Fallback to IP standard geolocation
            try {
              const res = await fetch('https://ipapi.co/json/');
              const data = await res.json();
              if (data.latitude && data.longitude) {
                setUserLoc({ lat: data.latitude, lng: data.longitude });
              } else {
                throw new Error("Invalid IP geo data");
              }
            } catch (ipErr) {
              // Final fallback: Coordinates of Delhi
              setUserLoc({ lat: 28.6139, lng: 77.2090 });
            }
          },
          { timeout: 10000 }
        );
      } else {
        // Fallback: Coordinates of Delhi
        setUserLoc({ lat: 28.6139, lng: 77.2090 });
      }
    };

    fetchLocation();
  }, []);

  // 2. Initialize Mappls Map once we have the user location
  useEffect(() => {
    if (!userLoc || !mapContainerRef.current) return;

    const checkMappls = setInterval(() => {
      if (window.mappls) {
        clearInterval(checkMappls);
        if (!mapInitialized.current) initMap();
      }
    }, 500);

    const initMap = () => {
      if (mapInitialized.current) return;
      mapInitialized.current = true;
      try {
         const map = new window.mappls.Map(mapContainerRef.current, {
           center: [userLoc.lat, userLoc.lng],
           zoom: 12,
         });

         // Add a marker for the current user
         new window.mappls.Marker({
            map: map,
            position: { lat: userLoc.lat, lng: userLoc.lng },
            popupHtml: "<div style='padding: 10px; font-weight: bold;'>You are here</div>"
         });

         setMapObject(map);
         setLoading(false);
      } catch (err) {
         console.error("Map initialization failed", err);
         setError("Failed to load map interface.");
         setLoading(false);
      }
    };

    return () => clearInterval(checkMappls);
  }, [userLoc]);

  // 3. Mark the NGOs on the map
  useEffect(() => {
    if (!mapObject || !ngos || ngos.length === 0 || !userLoc) return;

    const activeIds = new Set<string>();

    // If DB is completely empty (no NGOs signed up yet), provide fallback demo models so the map doesn't look broken
    const localNgos = ngos.length > 0 ? ngos : [
      { id: "demo_1", name: "SafeHaven Shelter", email: "contact@safehaven.org", location: "Downtown Central" },
      { id: "demo_2", name: "Community Kitchen", email: "hello@kitchen.org", location: "North District" },
      { id: "demo_3", name: "Food Rescue East", email: "east@rescue.org", location: "Eastside" }
    ];

    localNgos.forEach((ngo) => {
      const id = ngo.id || ngo.email || Math.random().toString();
      activeIds.add(id);

      let ngoLat = userLoc.lat;
      let ngoLng = userLoc.lng;

      if (ngo.lat && ngo.lng) {
          // Absolute True Coordinates from Mappls Geocoding
          ngoLat = ngo.lat;
          ngoLng = ngo.lng;
      } else {
          // Fallback legacy offset if DB misses coordinates
          const seed = id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          const latOffset = (Math.sin(seed) * 0.02); 
          const lngOffset = (Math.cos(seed) * 0.02);
          ngoLat += latOffset;
          ngoLng += lngOffset;
      }

      const html = `<div style="padding: 10px; font-family: sans-serif;">
        <h3 style="font-weight: 900; color: #4f46e5; margin-bottom: 5px;">${ngo.name || 'Local NGO'}</h3>
        <p style="font-size: 12px; color: #4b5563;">${ngo.email || 'ngo@example.com'}</p>
        <p style="font-size: 12px; font-weight: 600; margin-top: 5px;">Address: ${ngo.location || 'Local'}</p>
        ${ngo.website ? `<a href="${ngo.website}" target="_blank" style="display: inline-block; margin-top: 10px; font-size: 11px; font-weight: 800; color: white; background: #4f46e5; padding: 5px 10px; border-radius: 5px; text-decoration: none;">Visit Website</a>` : ''}
      </div>`;

      if (markersRef.current[id]) {
         markersRef.current[id].setPosition({ lat: ngoLat, lng: ngoLng });
      } else {
         const marker = new window.mappls.Marker({
           map: mapObject,
           position: { lat: ngoLat, lng: ngoLng },
           popupHtml: html,
           icon: 'https://apis.mapmyindia.com/map_v3/1.png'
         });
         markersRef.current[id] = marker;
      }
    });

    Object.keys(markersRef.current).forEach(id => {
        if (!activeIds.has(id)) {
            markersRef.current[id].remove();
            delete markersRef.current[id];
        }
    });

  }, [mapObject, ngos, userLoc]);

  if (error) {
    return (
      <div className="w-full h-80 rounded-3xl bg-red-50 border border-red-200 flex flex-col items-center justify-center text-red-500">
        <AlertCircle size={48} className="mb-4" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-200 bg-gray-50">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 size={40} className="text-secondary animate-spin mb-4" />
          <p className="font-bold text-gray-500 flex items-center gap-2">
            <Navigation size={18} /> Locating nearby partners...
          </p>
        </div>
      )}
      
      {/* MapmyIndia Mount Point */}
      <div 
        ref={mapContainerRef} 
        id="mappls-map" 
        className="w-full h-full"
      ></div>
    </div>
  );
}
