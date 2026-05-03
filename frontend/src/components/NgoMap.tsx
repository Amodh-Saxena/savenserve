import { useEffect, useRef, useState } from 'react';
import { Loader2, Navigation, AlertCircle } from 'lucide-react';
import { resolveCoordinates, CHENNAI_DEFAULT } from '../services/geocoding';

declare global {
  interface Window { mappls: any; }
}

interface NgoMapProps {
  ngos: any[];
  userLocation?: { lat: number; lng: number };
}

// Real Chennai NGO demo data shown when the database has no NGO records
const DEMO_NGOS = [
  { id: 'demo_irf',    name: 'Indian Relief Foundation',  email: 'contact@irf.org.in',         location: 'T. Nagar, Chennai, Tamil Nadu 600017',      lat: 13.0674, lng: 80.2376 },
  { id: 'demo_goonj',  name: 'Goonj Chennai',             email: 'chennai@goonj.org',           location: 'Anna Nagar, Chennai, Tamil Nadu 600040',    lat: 13.1186, lng: 80.2324 },
  { id: 'demo_aksha',  name: 'Akshaya Patra Foundation',  email: 'chennai@akshayapatra.org',    location: 'Adyar, Chennai, Tamil Nadu 600020',         lat: 13.0100, lng: 80.2341 },
];

export default function NgoMap({ ngos, userLocation }: NgoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapObject, setMapObject] = useState<any>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef<{ [key: string]: any }>({});
  const mapInitialized = useRef(false);

  // 1. Resolve user location — profile > browser GPS > IP geo > Chennai default
  useEffect(() => {
    if (userLocation) {
      setUserLoc(userLocation);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        async () => {
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            setUserLoc(data.latitude && data.longitude
              ? { lat: data.latitude, lng: data.longitude }
              : CHENNAI_DEFAULT);
          } catch {
            setUserLoc(CHENNAI_DEFAULT);
          }
        },
        { timeout: 10000 }
      );
    } else {
      setUserLoc(CHENNAI_DEFAULT);
    }
  }, [userLocation]);

  // 2. Initialize Mappls Map once we have coordinates (only once)
  useEffect(() => {
    if (!userLoc || !mapContainerRef.current || mapInitialized.current) return;

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
        new window.mappls.Marker({
          map,
          position: { lat: userLoc.lat, lng: userLoc.lng },
          popupHtml: "<div style='padding:10px;font-weight:bold;'>Your Location</div>",
        });
        setMapObject(map);
        setLoading(false);
      } catch {
        setError('Failed to load map interface.');
        setLoading(false);
      }
    };

    return () => clearInterval(checkMappls);
  }, [userLoc]);

  // 2b. Re-centre map when userLoc changes after init
  useEffect(() => {
    if (!mapObject || !userLoc || !mapInitialized.current) return;
    mapObject.setCenter([userLoc.lat, userLoc.lng]);
  }, [mapObject, userLoc]);

  // 3. Plot NGO markers — uses pincode from location string for geocoding
  useEffect(() => {
    if (!mapObject || !userLoc) return;

    const displayNgos = ngos.length > 0 ? ngos : DEMO_NGOS;
    const activeIds = new Set<string>(displayNgos.map(n => n.id || n.email));

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    displayNgos.forEach(async (ngo) => {
      const id = ngo.id || ngo.email || String(Math.random());
      if (markersRef.current[id]) return;

      // Resolve using pincode from location string → stored lat/lng → fallback
      const coords = await resolveCoordinates(ngo.lat, ngo.lng, ngo.location, id);
      if (!mapObject) return;

      const popupHtml = `
        <div style="padding:10px;font-family:sans-serif;width:210px;">
          <h3 style="font-weight:900;color:#4f46e5;margin-bottom:5px;">${ngo.name || 'Local NGO'}</h3>
          <p style="font-size:12px;color:#4b5563;margin-bottom:4px;">${ngo.email || ''}</p>
          <p style="font-size:12px;font-weight:600;margin-top:5px;">📍 ${ngo.location || 'Chennai, Tamil Nadu'}</p>
          ${ngo.website ? `<a href="${ngo.website}" target="_blank" style="display:inline-block;margin-top:10px;font-size:11px;font-weight:800;color:white;background:#4f46e5;padding:5px 10px;border-radius:5px;text-decoration:none;">Visit Website</a>` : ''}
        </div>`;

      markersRef.current[id] = new window.mappls.Marker({
        map: mapObject,
        position: coords,
        popupHtml: popupHtml,
      });
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
      <div ref={mapContainerRef} id="mappls-map" className="w-full h-full"></div>
    </div>
  );
}
