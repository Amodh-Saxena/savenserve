import { useEffect, useRef, useState } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Loader2, Navigation, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    mappls: any;
    requestPickupFromMap: (foodId: string) => void;
  }
}

interface RealTimeDonationMapProps {
  userLocation?: { lat: number; lng: number };
  donors?: any[];
}

export default function RealTimeDonationMap({ userLocation, donors = [] }: RealTimeDonationMapProps) {
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapObject, setMapObject] = useState<any>(null);
  const [localCoords, setLocalCoords] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapInitialized = useRef(false);
  
  // Track all currently active map markers
  const markersRef = useRef<{ [key: string]: any }>({});

  // 1. Fetch Location if not provided natively
  useEffect(() => {
    if (userLocation) {
        setLocalCoords(userLocation);
        return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocalCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        async err => {
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            setLocalCoords({ lat: data.latitude, lng: data.longitude });
          } catch {
            setLocalCoords({ lat: 28.6139, lng: 77.2090 }); // Default Delhi
          }
        }
      );
    } else {
        setLocalCoords({ lat: 28.6139, lng: 77.2090 }); // Default Fallback
    }
  }, [userLocation]);

  // 2. Expose global function for raw HTML Marker Popup to call React API
  useEffect(() => {
    window.requestPickupFromMap = async (foodId: string) => {
        try {
            // Confirm with user
            if(confirm("Are you sure you want to request pickup for this food?")) {
               await api.put(`/foods/${foodId}`, { status: 'accepted' });
               alert("Pickup successfully requested! The donor has been notified via email.");
            }
        } catch (e) {
            console.error(e);
            alert("Error requesting pickup.");
        }
    };
    return () => {
       // Cleanup global func to prevent memory leaks if remounted
       delete (window as any).requestPickupFromMap;
    }
  }, []);

  // 3. Initialize Mappls Map
  useEffect(() => {
    if (!localCoords || !mapContainerRef.current) return;

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
           center: [localCoords.lat, localCoords.lng],
           zoom: 12,
         });

         // User Marker
         new window.mappls.Marker({
            map: map,
            position: { lat: localCoords.lat, lng: localCoords.lng },
            popupHtml: "<div style='padding:10px;font-weight:900'>Your Base Location</div>"
         });

         setMapObject(map);
         setLoading(false);
      } catch (err) {
         setError("Failed to load map interface.");
         setLoading(false);
      }
    };

    return () => clearInterval(checkMappls);
  }, [localCoords]);

  // Helper method for urgency color map markers
  const getUrgencyConfig = (expiryDate: string) => {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const hoursDiff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDiff <= 6) {    // RED (High Urgency)
         return { color: '#ef4444', label: 'URGENT' };
      }
      if (hoursDiff <= 24) {   // ORANGE (Medium Urgency)
         return { color: '#f59e0b', label: 'MEDIUM' };
      }
      return { color: '#10b981', label: 'FRESH' }; // GREEN (Low Urgency)
  };

  // 4. Real-time Firebase Sync logic
  useEffect(() => {
    if (!mapObject || !localCoords) return;

    // Listen only for food that is actively pending pickup
    const q = query(
        collection(db, "food_listings"), 
        where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const activeIds = new Set<string>();

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            activeIds.add(id);

            // Compute Marker Coordinates
            // Fallback determinism if 'lat/lng' wasn't set by old DB records
            let fLat = data.lat;
            let fLng = data.lng;
            if (!fLat || !fLng) {
               // Hash the string ID into a consistent math offset for Demo visuals
               const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
               fLat = localCoords.lat + (Math.sin(seed) * 0.08); 
               fLng = localCoords.lng + (Math.cos(seed) * 0.08);
            }

            const urgency = getUrgencyConfig(data.expiry_date);

            // Build dynamic Popup HTML
            const popupContent = `
                <div style="font-family: inherit; padding: 15px; width: 220px;">
                    <div style="background-color: ${urgency.color}15; color: ${urgency.color}; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 900; letter-spacing: 1px; display: inline-block; margin-bottom: 8px;">
                      ${urgency.label} PRIORITY
                    </div>
                    <h3 style="font-weight: 900; font-size: 16px; margin: 0 0 5px 0; color: #111827;">${data.title}</h3>
                    <p style="font-size: 14px; font-weight: bold; color: #4b5563; margin: 0 0 8px 0;">📦 ${data.quantity}</p>
                    <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 12px 0;">📍 ${data.location}</p>
                    <p style="font-size: 11px; color: #9ca3af; margin: 0 0 12px 0;">Expires: ${new Date(data.expiry_date).toLocaleString()}</p>
                    <button 
                        onclick="window.requestPickupFromMap('${id}')"
                        style="width: 100%; padding: 10px; background: #e5e7eb; color: #111827; border: none; border-radius: 8px; font-weight: 900; cursor: pointer; transition: 0.2s;"
                        onmouseover="this.style.background='#84cc16'; this.style.color='#fff'"
                        onmouseout="this.style.background='#e5e7eb'; this.style.color='#111827'"
                    >
                        Request Pickup
                    </button>
                </div>
            `;

            // SVG string for custom colored marker pin
            const svgPin = `<svg width="40" height="40" viewBox="0 0 24 24" fill="${urgency.color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`;

            if (markersRef.current[id]) {
                // Update existing marker position & html if necessary
                markersRef.current[id].setPosition({ lat: fLat, lng: fLng });
            } else {
                // Create completely new marker onto Mapmyindia
                const marker = new window.mappls.Marker({
                    map: mapObject,
                    position: { lat: fLat, lng: fLng },
                    html: svgPin,
                    width: 40,
                    height: 40,
                    popupHtml: popupContent
                });
                markersRef.current[id] = marker;
            }
        });

        // Cleanup completed/accepted donations from map automatically
        Object.keys(markersRef.current).forEach(id => {
            if (!activeIds.has(id)) {
                // Donation was claimed! Pop it off the map
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });
    });

    return () => unsubscribe(); // Stop listening visually on unmount 
  }, [mapObject, localCoords]);

  // 5. Plot Permanent Donor Locations Network
  useEffect(() => {
     if (!mapObject || !localCoords || !donors || donors.length === 0) return;
     
     // Donor SVG pin (Blue Hexagon)
     const donorPin = `<svg width="35" height="35" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><path d="M12 7v6l4 2"></path></svg>`;

     donors.forEach(donor => {
         let dLat = localCoords.lat;
         let dLng = localCoords.lng;
         
         if (donor.lat && donor.lng) {
             dLat = donor.lat;
             dLng = donor.lng;
         } else {
             // Fallback offset for testing unregistered legacy donors
             const seed = (donor.id || donor.email || "demo").split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
             dLat += (Math.sin(seed) * 0.05); 
             dLng += (Math.cos(seed) * 0.05);
         }

         const popupHtml = `
            <div style="padding: 15px; width: 200px;">
               <div style="background-color: #eff6ff; color: #3b82f6; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 900; letter-spacing: 1px; display: inline-block; margin-bottom: 8px;">
                 REGISTERED DONOR
               </div>
               <h3 style="font-weight: 900; font-size: 15px; margin: 0 0 5px 0;">${donor.name || donor.email.split('@')[0]}</h3>
               <p style="font-size: 12px; font-weight: bold; color: #6b7280; margin: 0 0 5px 0;">📍 ${donor.location || 'Local Regional Partner'}</p>
               <p style="font-size: 11px; font-weight: bold; color: #3b82f6; margin: 0;">Verified Member</p>
            </div>
         `;

         // Use a unique static marker string prefix to prevent collision with food markers
         const uniqueKey = 'donor_' + donor.id;
         if (!markersRef.current[uniqueKey]) {
            const m = new window.mappls.Marker({
                map: mapObject,
                position: { lat: dLat, lng: dLng },
                html: donorPin,
                width: 35,
                height: 35,
                popupHtml: popupHtml
            });
            markersRef.current[uniqueKey] = m;
         }
     });

  }, [mapObject, localCoords, donors]);

  if (error) {
    return (
      <div className="w-full h-full rounded-3xl bg-red-50 border border-red-200 flex flex-col items-center justify-center text-red-500 p-12">
        <AlertCircle size={48} className="mb-4" />
        <p className="font-bold text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[80vh] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200 border border-gray-200 bg-gray-50">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 size={40} className="text-primary-dark animate-spin mb-4" />
          <p className="font-bold text-gray-500 flex items-center gap-2 tracking-wide">
            <Navigation size={18} /> INITIALIZING SATELLITE UPLINK...
          </p>
        </div>
      )}
      
      {/* MapmyIndia Mount Point */}
      <div id="mappls-realtime-dom" ref={mapContainerRef} className="w-full h-full"></div>
      
      {/* Status Legend Overlay */}
      {!loading && (
          <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-100 z-10 pointer-events-none">
              <h4 className="text-xs font-black uppercase tracking-widest text-dark mb-3">Rescues Urgency</h4>
              <div className="space-y-2 text-xs font-bold text-gray-500">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> {'< 6 Hours left'}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> {'< 24 Hours'}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> {'Fresh'}</div>
                  <div className="w-full h-px bg-gray-200 my-2"></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> {'Regional Donor'}</div>
              </div>
          </div>
      )}
    </div>
  );
}
