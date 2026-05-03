import { useEffect, useRef, useState } from 'react';
import { Loader2, Navigation, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { resolveCoordinates, CHENNAI_DEFAULT } from '../services/geocoding';

declare global {
  interface Window {
    mappls: any;
    requestPickupFromMap: (foodId: string) => void;
  }
}

interface RealTimeDonationMapProps {
  userLocation?: { lat: number; lng: number };
  donors?: any[];
  foods?: any[];
}

export default function RealTimeDonationMap({ userLocation, donors = [], foods = [] }: RealTimeDonationMapProps) {
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapObject, setMapObject] = useState<any>(null);
  const [localCoords, setLocalCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapInitialized = useRef(false);

  const markersRef = useRef<{ [key: string]: any }>({});
  const userBaseMarkerRef = useRef<any>(null);

  // 1. Resolve map centre — user profile > browser GPS > IP geo > Chennai default
  useEffect(() => {
    if (userLocation) {
      setLocalCoords(userLocation);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocalCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        async () => {
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            setLocalCoords(data.latitude && data.longitude
              ? { lat: data.latitude, lng: data.longitude }
              : CHENNAI_DEFAULT);
          } catch {
            setLocalCoords(CHENNAI_DEFAULT);
          }
        }
      );
    } else {
      setLocalCoords(CHENNAI_DEFAULT);
    }
  }, [userLocation]);

  // 2. Expose global pickup function for popup HTML buttons
  useEffect(() => {
    window.requestPickupFromMap = async (foodId: string) => {
      try {
        if (confirm('Are you sure you want to request pickup for this food?')) {
          await api.put(`/foods/${foodId}`, { status: 'accepted' });
          alert('Pickup successfully requested! The donor has been notified via email.');
        }
      } catch (e) {
        console.error(e);
        alert('Error requesting pickup.');
      }
    };
    return () => { delete (window as any).requestPickupFromMap; };
  }, []);

  // 3. Initialize Mappls Map (only once on first coordinate load)
  useEffect(() => {
    if (!localCoords || !mapContainerRef.current || mapInitialized.current) return;

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
        const baseMarker = new window.mappls.Marker({
          map,
          position: { lat: localCoords.lat, lng: localCoords.lng },
          popupHtml: "<div style='padding:10px;font-weight:900'>Your Base Location</div>",
        });
        userBaseMarkerRef.current = baseMarker;
        setMapObject(map);
        setLoading(false);
      } catch {
        setError('Failed to load map interface.');
        setLoading(false);
      }
    };

    return () => clearInterval(checkMappls);
  }, [localCoords]);

  // 3b. Re-centre map + move base marker when localCoords changes after init
  useEffect(() => {
    if (!mapObject || !localCoords || !mapInitialized.current) return;
    mapObject.setCenter([localCoords.lat, localCoords.lng]);
    if (userBaseMarkerRef.current) {
      try {
        userBaseMarkerRef.current.setPosition({ lat: localCoords.lat, lng: localCoords.lng });
      } catch {
        userBaseMarkerRef.current = new window.mappls.Marker({
          map: mapObject,
          position: { lat: localCoords.lat, lng: localCoords.lng },
          popupHtml: "<div style='padding:10px;font-weight:900'>Your Base Location</div>",
        });
      }
    }
  }, [mapObject, localCoords]);

  // Urgency colour from expiry time
  const getUrgencyConfig = (expiryDate: string) => {
    const hoursDiff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursDiff <= 6)  return { color: '#ef4444', label: 'URGENT' };
    if (hoursDiff <= 24) return { color: '#f59e0b', label: 'MEDIUM' };
    return { color: '#10b981', label: 'FRESH' };
  };

  // 4. Plot food markers — uses pincode from location string to geocode if no lat/lng stored
  useEffect(() => {
    if (!mapObject) return;

    const pendingFoods = foods.filter(f => f.status === 'pending');
    const activeIds = new Set<string>(pendingFoods.map(f => f.id));

    // Remove stale markers first
    Object.keys(markersRef.current).forEach(id => {
      if (!id.startsWith('donor_') && !activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    pendingFoods.forEach(async (data) => {
      const id = data.id;

      // Resolve coordinates: stored → pincode geocode → address geocode → fallback
      const coords = await resolveCoordinates(data.lat, data.lng, data.location, id);
      if (!mapObject) return; // guard: map may have unmounted

      const urgency = getUrgencyConfig(data.expiry_date);

      const popupContent = `
        <div style="font-family: inherit; padding: 15px; width: 230px;">
          <div style="background-color: ${urgency.color}15; color: ${urgency.color}; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 900; letter-spacing: 1px; display: inline-block; margin-bottom: 8px;">
            ${urgency.label} PRIORITY
          </div>
          <h3 style="font-weight: 900; font-size: 16px; margin: 0 0 5px 0; color: #111827;">${data.title}</h3>
          <p style="font-size: 14px; font-weight: bold; color: #4b5563; margin: 0 0 6px 0;">📦 ${data.quantity}</p>
          <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 6px 0;">📍 ${data.location}</p>
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 12px 0;">Expires: ${new Date(data.expiry_date).toLocaleString()}</p>
          <button
            onclick="window.requestPickupFromMap('${id}')"
            style="width:100%;padding:10px;background:#e5e7eb;color:#111827;border:none;border-radius:8px;font-weight:900;cursor:pointer;"
            onmouseover="this.style.background='#84cc16';this.style.color='#fff'"
            onmouseout="this.style.background='#e5e7eb';this.style.color='#111827'"
          >Request Pickup</button>
        </div>`;

      const svgPin = `<svg width="40" height="40" viewBox="0 0 24 24" fill="${urgency.color}" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`;

      if (markersRef.current[id]) {
        markersRef.current[id].setPosition(coords);
      } else {
        markersRef.current[id] = new window.mappls.Marker({
          map: mapObject,
          position: coords,
          html: svgPin,
          width: 40,
          height: 40,
          popupHtml: popupContent,
        });
      }
    });
  }, [mapObject, foods]);

  // 5. Plot donor markers — also uses pincode from location string to geocode
  useEffect(() => {
    if (!mapObject || donors.length === 0) return;

    const donorPin = `<svg width="35" height="35" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><path d="M12 7v6l4 2"></path></svg>`;

    donors.forEach(async (donor) => {
      const uniqueKey = 'donor_' + donor.id;
      if (markersRef.current[uniqueKey]) return;

      const coords = await resolveCoordinates(donor.lat, donor.lng, donor.location, donor.id || donor.email || 'donor');
      if (!mapObject) return;

      const popupHtml = `
        <div style="padding:15px;width:200px;">
          <div style="background:#eff6ff;color:#3b82f6;padding:4px 8px;border-radius:4px;font-size:10px;font-weight:900;letter-spacing:1px;display:inline-block;margin-bottom:8px;">REGISTERED DONOR</div>
          <h3 style="font-weight:900;font-size:15px;margin:0 0 5px 0;">${donor.name || donor.email?.split('@')[0] || 'Donor'}</h3>
          <p style="font-size:12px;font-weight:bold;color:#6b7280;margin:0 0 5px 0;">📍 ${donor.location || 'Chennai, Tamil Nadu'}</p>
          <p style="font-size:11px;font-weight:bold;color:#3b82f6;margin:0;">Verified Member</p>
        </div>`;

      markersRef.current[uniqueKey] = new window.mappls.Marker({
        map: mapObject,
        position: coords,
        html: donorPin,
        width: 35,
        height: 35,
        popupHtml: popupHtml,
      });
    });
  }, [mapObject, donors]);

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
      <div id="mappls-realtime-dom" ref={mapContainerRef} className="w-full h-full"></div>
      {!loading && (
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-100 z-10 pointer-events-none">
          <h4 className="text-xs font-black uppercase tracking-widest text-dark mb-3">Rescue Urgency</h4>
          <div className="space-y-2 text-xs font-bold text-gray-500">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>{'< 6 Hours'}</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span>{'< 24 Hours'}</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>Fresh</div>
            <div className="w-full h-px bg-gray-200 my-2"></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span>Donor</div>
          </div>
        </div>
      )}
    </div>
  );
}
