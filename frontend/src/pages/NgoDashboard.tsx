import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { sendDynamicEmail } from '../services/emailService';
import { LogOut, MapPin, Clock, Heart, Globe, Activity, Package } from 'lucide-react';
import RealTimeDonationMap from '../components/RealTimeDonationMap';

export default function NgoDashboard() {
  const { user, logout } = useAuth();
  const [foods, setFoods] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  // Live map center — initialized from stored profile, updated on address change
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | undefined>(
    user?.lat && user?.lng ? { lat: user.lat, lng: user.lng } : undefined
  );

  useEffect(() => {
    api.get('/foods/')
       .then(res => setFoods(res.data))
       .catch(e => console.error(e));

    api.get('/users/')
       .then(res => setUsers(res.data))
       .catch(e => console.error(e));
  }, []);

  // Performance cache preventing massive lag spikes when typing into Modals
  const donorList = useMemo(() => users.filter(u => u.role === 'donor'), [users]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFood, setActiveFood] = useState<any>(null);
  const [pickupPerson, setPickupPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  const [updatingAddress, setUpdatingAddress] = useState(false);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');

  const openAcceptModal = (food: any) => {
    setActiveFood(food);
    setPickupPerson(user?.name || user?.email || '');
    setContactNumber('');
    setIsModalOpen(true);
  };

  const confirmAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFood) return;
    const food = activeFood;

    try {
      // Sync with backend Database
      await api.put(`/foods/${food.id}`, { status: 'accepted' });

      // Update local state
      setFoods(foods.map(f => f.id === food.id ? { ...f, status: 'accepted' } : f));

      // Find donor details
      const donor = users.find(u => u.id === food.donor_id);
      const donorEmail = donor?.email;
      
      console.log("[Debug] NGO Accepting Donation:", food.title);
      console.log("[Debug] Found Donor:", donor);
      console.log("[Debug] Pickup Person:", pickupPerson);
      console.log("[Debug] Contact Number:", contactNumber);

      // Trigger EmailJS Notification to NGO
      const isSuccessNGO = await sendDynamicEmail({
        name: user?.name || user?.email || 'An NGO',
        food_type: food.title,
        quantity: food.quantity,
        location: food.location,
        time: new Date().toLocaleString(),
        status: 'Accepted for Pickup',
        to_email: user?.email, // NGO's email
        pickup_person: pickupPerson,
        contact_number: contactNumber
      });

      // Trigger EmailJS Notification to Donor
      let isSuccessDonor = false;
      if (donorEmail) {
         isSuccessDonor = await sendDynamicEmail({
          name: donor?.name || donor?.email || 'Donor',
          food_type: food.title,
          quantity: food.quantity,
          location: food.location,
          time: new Date().toLocaleString(),
          status: 'Accepted for Pickup',
          to_email: donorEmail,
          pickup_person: pickupPerson,
          contact_number: contactNumber
        });
      }

      if (isSuccessNGO || isSuccessDonor) {
        alert(`Donation requested! Notification sent for ${food.title}.`);
      }
      
      setIsModalOpen(false);
      setActiveFood(null);
    } catch (error) {
      console.error("Failed to accept donation:", error);
      alert("Error accepting donation. Please try again.");
    }
  };

  const handleAddressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLine1.trim() || !addrCity.trim() || !addrState.trim() || !addrZip.trim()) {
        alert("Please fill in all mandatory address fields.");
        return;
    }
    setUpdatingAddress(true);
    const combinedAddress = `${addrLine1}, ${addrLine2 ? addrLine2 + ', ' : ''}${addrCity}, ${addrState}, ${addrZip}`;
    
    try {
        const response = await api.put('/users/update_me', { location: combinedAddress });
        const updatedUser = response.data;
        
        // Immediately move the map marker to the new geocoded coordinates
        if (updatedUser.lat && updatedUser.lng) {
          setMapCenter({ lat: updatedUser.lat, lng: updatedUser.lng });
        }
        
        alert(`Address updated! Map marker moved to: ${combinedAddress}`);
        setIsAddressModalOpen(false);
        // Reset form fields
        setAddrLine1(''); setAddrLine2(''); setAddrCity(''); setAddrState(''); setAddrZip('');
    } catch (err: any) {
        const detail = err.response?.data?.detail || err.message || "Unknown error";
        alert("Failed to update address. Server says: " + detail);
    }
    setUpdatingAddress(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-200 transition-colors duration-500">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-100 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-white/80 border-b border-slate-200 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              NGO Portal
            </h1>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
               <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm backdrop-blur-md hover:border-indigo-300 transition-all hover:-translate-y-[1px] group cursor-pointer"
               >
                   <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase text-xs group-hover:bg-indigo-100 transition-colors">
                     <MapPin size={14} />
                   </div>
                   <div className="flex flex-col items-start">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Operating Base</span>
                     <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{user?.location || 'Unknown'}</span>
                   </div>
               </button>

            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm backdrop-blur-md">
                <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold uppercase text-xs">
                  {user?.email?.[0] || 'U'}
                </div>
                <span className="text-sm font-semibold text-slate-700">{user?.email}</span>
            </div>
            <button 
              onClick={logout} 
              className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-red-200"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
            {...({ 
              initial: { opacity: 0, y: 20 }, 
              animate: { opacity: 1, y: 0 }, 
              className: "space-y-12" 
            } as any)}
        >
            {/* Massive Real-Time Interactive Map Container */}
            <div className="w-full relative shadow-md rounded-2xl overflow-hidden border border-slate-200">
                <div className="absolute top-0 left-0 bg-slate-800 text-white px-6 py-2 rounded-br-2xl font-bold text-xs tracking-widest flex items-center gap-3 z-10 shadow-lg">
                    <Activity className="text-indigo-400 animate-pulse" size={16} />
                    LIVE SATELLITE TRACKING
                </div>
                <RealTimeDonationMap 
                  donors={donorList} 
                  foods={foods} 
                  userLocation={mapCenter}
                />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-10 border-t border-slate-200">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Donors near you, in Chennai</h2>
                <p className="text-slate-500 font-medium text-base">Track surplus food from verified contributors in the city and fulfill logistics.</p>
              </div>
              <div className="px-6 py-3 rounded-lg bg-white border border-slate-200 text-indigo-700 font-bold uppercase tracking-widest text-xs shadow-sm backdrop-blur-md">
                {foods.filter(f => f.status === 'pending').length} Open Requests
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {foods.filter(f => f.status === 'pending').map(food => (
                  <motion.div 
                    {...({ 
                      layout: true,
                      initial: { opacity: 0, scale: 0.98 },
                      animate: { opacity: 1, scale: 1 },
                      key: food.id,
                      className: "group relative rounded-xl bg-white border border-slate-200 overflow-hidden hover:border-indigo-400 transition-all flex flex-col shadow-sm hover:shadow-lg"
                    } as any)}
                  >
                    <div className="h-1 bg-indigo-500"></div>
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Package className="w-6 h-6 text-indigo-600" />
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-slate-800 text-xl mb-4 group-hover:text-indigo-700 transition-colors">{food.title}</h3>
                      
                      <div className="space-y-3 text-slate-500 font-medium text-sm mb-8 flex-1">
                        <p className="flex items-center gap-3">
                          <MapPin size={16} className="text-indigo-400"/> 
                          {food.location}
                        </p>
                        <p className="flex items-center gap-3">
                          <Clock size={16} className="text-indigo-400"/> 
                          Expires: {new Date(food.expiry_date).toLocaleDateString()}
                        </p>
                        <p className="flex items-center gap-3 pl-1">
                          <span className="w-1 h-4 bg-indigo-400 rounded-sm mr-2"></span>
                          Quantity: <span className="text-slate-800 font-semibold ml-1">{food.quantity}</span>
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => openAcceptModal(food)}
                        className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                      >
                        Accept Donation
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty State */}
              {foods.filter(f => f.status === 'pending').length === 0 && (
                  <motion.div 
                    {...({ 
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      key: "empty",
                      className: "col-span-full py-24 px-10 border border-slate-200 rounded-2xl text-center bg-white shadow-sm"
                    } as any)}
                  >
                     <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-6">
                        <Globe className="w-10 h-10 text-slate-300" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 mb-2">No Active Logistics</h3>
                     <p className="text-slate-500 font-medium text-base max-w-sm mx-auto">Verified operations currently have no pending surplus requests in your designated area.</p>
                  </motion.div>
              )}
            </div>
        </motion.div>

        {/* Acceptance Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div 
              {...({
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm"
              } as any)}
            >
              <motion.div 
                {...({
                  initial: { scale: 0.95, y: 20 },
                  animate: { scale: 1, y: 0 },
                  exit: { scale: 0.95, y: 20 },
                  className: "bg-white border border-slate-200 p-8 rounded-2xl w-full max-w-md shadow-xl relative"
                } as any)}
              >
                <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Logistics Details</h3>
                <p className="text-slate-500 text-sm mb-6">Verified information required to establish secure chain-of-custody.</p>
                
                <form onSubmit={confirmAccept} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Executive Name</label>
                    <input 
                      required 
                      value={pickupPerson} 
                      onChange={e=>setPickupPerson(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm" 
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Dispatch Contact</label>
                    <input 
                      required 
                      value={contactNumber} 
                      onChange={e=>setContactNumber(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm" 
                      placeholder="e.g. +1 234 567 890"
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all font-semibold text-slate-600 bg-white"
                    >
                      Cancel Action
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                    >
                      Process Fulfillment
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Structured Address Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <motion.div 
            {...({
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm"
            } as any)}
          >
            <motion.div 
              {...({
                initial: { scale: 0.95, y: 20 },
                animate: { scale: 1, y: 0 },
                exit: { scale: 0.95, y: 20 },
                className: "bg-white border border-slate-200 p-8 rounded-2xl w-full max-w-lg shadow-xl relative"
              } as any)}
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm mb-6">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2">Update Operational Coordinates</h3>
              <p className="text-slate-500 font-medium text-sm mb-8">Maintain accurate regional data to ensure high-priority dispatch efficiency.</p>
              
              <form onSubmit={handleAddressUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address Line 1 (REQUIRED)</label>
                  <input 
                    required 
                    value={addrLine1} 
                    onChange={e=>setAddrLine1(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                    placeholder="House no, Building, Street"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address Line 2 (OPTIONAL)</label>
                  <input 
                    value={addrLine2} 
                    onChange={e=>setAddrLine2(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                    placeholder="Apartment, Suite, Landmark"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                    <input 
                      required 
                      value={addrCity} 
                      onChange={e=>setAddrCity(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                      placeholder="e.g. Chennai"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">State / Province</label>
                    <input 
                      required 
                      value={addrState} 
                      onChange={e=>setAddrState(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                      placeholder="e.g. Tamil Nadu"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Postal / PIN Code</label>
                  <input 
                    required 
                    value={addrZip} 
                    onChange={e=>setAddrZip(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                    placeholder="e.g. 600001"
                  />
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all font-semibold text-slate-600 bg-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={updatingAddress}
                    className="flex-[2] bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold shadow-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {updatingAddress ? 'Geocoding...' : 'Synchronize Coordinates'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </main>
    </div>
  );
}
