// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { sendDynamicEmail } from '../services/emailService';
import { PlusCircle, LogOut, Heart, Globe, AlertCircle, MapPin } from 'lucide-react';
import NgoMap from '../components/NgoMap';

export default function DonorDashboard() {
  const { user, logout } = useAuth();
  const [foods, setFoods] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState(user?.location || '');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [expiry, setExpiry] = useState('');
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');

  const fetchData = async () => {
    try {
        const [foodsRes, usersRes] = await Promise.all([
           api.get('/foods/'),
           api.get('/users/')
        ]);
        setFoods(foodsRes.data.filter((f: any) => f.donor_id === user?.id));
        setNgos(usersRes.data.filter((u: any) => u.role === 'ngo'));
        
        // Background Geolocation fetch for new donations
        if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(
             pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
             err => console.warn("Geo denied, user coordinates undefined")
           );
        }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Minimum Value Validation
    const quantityNumMatch = quantity.match(/\d+(\.\d+)?/);
    if (!quantityNumMatch) {
       setFormError("Please specify a valid numerical quantity (e.g., '50 kg' or '75 meals').");
       return;
    }
    const quantityValue = parseFloat(quantityNumMatch[0]);
    if (quantityValue < 50) {
       setFormError("For large-scale impact, the minimum logistics requirement is 50 units/kg.");
       return;
    }

    try {
      const payload: any = {
        title, quantity, location, expiry_date: new Date(expiry).toISOString()
      };
      if (userCoords?.lat) payload.lat = userCoords.lat;
      if (userCoords?.lng) payload.lng = userCoords.lng;

      await api.post('/foods/', payload);
      
      setTitle(''); setQuantity(''); setExpiry('');
      fetchData();
      
      sendDynamicEmail({
        name: user?.name || user?.email || 'Donor',
        food_type: title,
        quantity: quantity,
        location: location,
        time: new Date().toLocaleString(),
        status: 'pending'
      }).catch(err => console.warn("Email warning:", err));
      
    } catch (e: any) {
      console.error(e.response || e);
      alert("Error adding food listing.");
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
        await api.put('/users/update_me', { location: combinedAddress });
        alert("Your operating address and GPS coordinate signature has been successfully updated on the map!");
        setIsAddressModalOpen(false);
        window.location.reload(); 
    } catch (err) {
        alert("Failed to update address. Please try again.");
    }
    setUpdatingAddress(false);
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-dark selection:bg-primary/30 transition-colors duration-500">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-5%] w-[30%] h-[30%] bg-primary/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-white/60 border-b border-gray-200 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
              Donor Portal
            </h1>
          </div>
          
            <div className="flex items-center gap-6 relative z-10">
               <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-gray-100 shadow-sm backdrop-blur-md hover:border-primary/30 transition-all hover:-translate-y-[1px] group cursor-pointer"
               >
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-emerald-600/20 border border-primary/10 flex items-center justify-center text-primary-dark font-black uppercase text-xs group-hover:bg-primary/30">
                     <MapPin size={14} />
                   </div>
                   <div className="flex flex-col items-start">
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Operating Base</span>
                     <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{user?.location || 'Unknown'}</span>
                   </div>
               </button>

               <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-gray-100 shadow-sm backdrop-blur-md">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10 flex items-center justify-center text-primary-dark font-black uppercase text-xs">
                  {user?.email?.[0] || 'U'}
                </div>
                <span className="text-sm font-bold text-gray-700">{user?.email}</span>
            </div>
            <button 
              onClick={logout} 
              className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-500/20"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Action Panel */}
          <motion.div 
            {...({ 
              initial: { opacity: 0, x: -20 }, 
              animate: { opacity: 1, x: 0 }, 
              className: "lg:col-span-4 space-y-6" 
            } as any)}
          >
            <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-xl shadow-gray-200/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-secondary/20 transition-colors"></div>
              
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-dark">
                <PlusCircle className="text-secondary w-7 h-7"/> 
                New Listing
              </h2>

              <AnimatePresence>
                  {formError && (
                      <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 mb-6 text-sm font-bold flex items-center gap-3 shadow-sm"
                      >
                          <AlertCircle size={20} className="shrink-0" />
                          <p>{formError}</p>
                      </motion.div>
                  )}
              </AnimatePresence>
              
              <form onSubmit={handleAdd} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Food Title</label>
                  <input 
                    required 
                    value={title} 
                    onChange={e=>setTitle(e.target.value)} 
                    className="w-full px-5 py-4 bg-cream border border-gray-200 rounded-2xl text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                    placeholder="e.g. 10 Loaves of Fresh Bread"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Quantity</label>
                    <input 
                      required 
                      value={quantity} 
                      onChange={e=>setQuantity(e.target.value)} 
                      className="w-full px-5 py-4 bg-cream border border-gray-200 rounded-2xl text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                      placeholder="10 units"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Expiry</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={expiry} 
                      onChange={e=>setExpiry(e.target.value)} 
                      className="w-full px-5 py-4 bg-cream border border-gray-200 rounded-2xl text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    required 
                    value={location} 
                    onChange={e=>setLocation(e.target.value)} 
                    className="w-full px-5 py-4 bg-cream border border-gray-200 rounded-2xl text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                    placeholder="Pickup address"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-5 rounded-[1.5rem] font-black text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-1 active:scale-[0.98] mt-4"
                >
                  Post to Network
                </button>
              </form>
            </div>
          </motion.div>

          {/* List Panel */}
          <motion.div 
            {...({ 
              initial: { opacity: 0, x: 20 }, 
              animate: { opacity: 1, x: 0 }, 
              className: "lg:col-span-8 space-y-8" 
            } as any)}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tight text-dark">Your Impact History</h2>
              <div className="px-4 py-2 rounded-full bg-white border border-gray-200 text-primary-dark shadow-sm text-xs font-black uppercase tracking-widest">
                {foods.length} Active Listings
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <AnimatePresence mode="popLayout">
                {foods.length === 0 ? (
                   <motion.div 
                     {...({ 
                       initial: { opacity: 0, scale: 0.95 },
                       animate: { opacity: 1, scale: 1 },
                       key: "empty",
                       className: "p-20 border-2 border-dashed border-gray-200 rounded-[3rem] text-center bg-white shadow-sm"
                     } as any)}
                   >
                     <div className="w-20 h-20 rounded-3xl bg-cream border border-gray-100 flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-10 h-10 text-gray-400" />
                     </div>
                     <p className="text-xl font-bold text-gray-500 max-w-xs mx-auto">No active donations yet. Start making an impact today!</p>
                   </motion.div>
                ) : foods.map(food => (
                  <motion.div 
                    {...({ 
                      layout: true,
                      initial: { opacity: 0, scale: 0.98 },
                      animate: { opacity: 1, scale: 1 },
                      key: food.id,
                      className: "group p-6 rounded-[2rem] bg-white border border-gray-100 hover:border-primary/40 hover:bg-cream transition-all cursor-default shadow-md hover:shadow-xl"
                    } as any)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-cream border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                          <Heart className="w-7 h-7 text-primary-dark" />
                        </div>
                        <div>
                          <h3 className="font-black text-dark text-xl group-hover:text-primary transition-colors">{food.title}</h3>
                          <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2">
                             <span className="text-secondary-dark">{food.quantity}</span> 
                             <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                             Expires: {new Date(food.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto self-end sm:self-center">
                        <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
                          food.status === 'pending' 
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {food.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50"
        >
          <div className="flex items-center gap-3 mb-8">
            <Globe className="text-secondary" size={32} />
            <div>
              <h2 className="text-2xl font-black text-dark">NGOs near you, in Chennai</h2>
              <p className="text-gray-500 font-medium">Use the map to see NGOs actively receiving donations in the city.</p>
            </div>
          </div>
          <NgoMap ngos={ngos} />
        </motion.div>
      </main>

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
                className: "bg-white border border-gray-100 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative"
              } as any)}
            >
              <div className="w-16 h-16 rounded-2xl bg-cream border border-gray-100 flex items-center justify-center shadow-sm mb-6">
                <MapPin className="w-8 h-8 text-primary-dark" />
              </div>

              <h3 className="text-3xl font-black text-dark mb-2">Update Operating Base</h3>
              <p className="text-gray-500 font-bold text-sm mb-8">Provide your precise registered location so logistics trackers and local algorithms can accurately index your donations.</p>
              
              <form onSubmit={handleAddressUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Address Line 1 (MANDATORY)</label>
                  <input 
                    required 
                    value={addrLine1} 
                    onChange={e=>setAddrLine1(e.target.value)} 
                    className="w-full px-5 py-3 bg-cream border border-gray-200 rounded-xl text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                    placeholder="House no, Building, Street"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Address Line 2 (OPTIONAL)</label>
                  <input 
                    value={addrLine2} 
                    onChange={e=>setAddrLine2(e.target.value)} 
                    className="w-full px-5 py-3 bg-cream border border-gray-200 rounded-xl text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                    placeholder="Apartment, Suite, Landmark"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">City</label>
                    <input 
                      required 
                      value={addrCity} 
                      onChange={e=>setAddrCity(e.target.value)} 
                      className="w-full px-5 py-3 bg-cream border border-gray-200 rounded-xl text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                      placeholder="e.g. New Delhi"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">State / Province</label>
                    <input 
                      required 
                      value={addrState} 
                      onChange={e=>setAddrState(e.target.value)} 
                      className="w-full px-5 py-3 bg-cream border border-gray-200 rounded-xl text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                      placeholder="e.g. Delhi"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Postal / PIN Code</label>
                  <input 
                    required 
                    value={addrZip} 
                    onChange={e=>setAddrZip(e.target.value)} 
                    className="w-full px-5 py-3 bg-cream border border-gray-200 rounded-xl text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                    placeholder="e.g. 110001"
                  />
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="flex-1 px-5 py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all font-black text-gray-500 bg-white shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={updatingAddress}
                    className="flex-[2] bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-4 rounded-2xl font-black shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {updatingAddress ? 'Geocoding...' : 'Save Operations Base'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
