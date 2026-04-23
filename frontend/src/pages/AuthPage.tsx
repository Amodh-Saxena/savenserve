import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Mail, Lock, UserPlus, LogIn, ArrowLeft, Heart, MapPin, Phone } from 'lucide-react';
import api from '../services/api';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else {
        // Register securely on backend so the Mapmyindia APIs can physically Geocode the string!
        // We bypass direct Frontend Firestore 'setDoc' so the backend can attach "lat" & "lng" properties.
        try {
            await api.post('/auth/register', {
               email,
               password,
               role,
               name: email.split('@')[0],
               location: address,
               contact_number: contact
            });
            setIsLogin(true);
            setError('Registration successful! Please log in.');
        } catch (backendErr: any) {
             throw new Error(backendErr.response?.data?.detail || "Registration Failed.");
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <motion.div 
        {...({ initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "absolute top-8 left-8" } as any)}
      >
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-gray-500 hover:text-dark transition-colors group font-bold"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
      </motion.div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
           {...({ initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "text-center" } as any)}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-emerald-600 shadow-xl shadow-primary/20 mb-6">
            <Heart className="w-10 h-10 text-white fill-current" />
          </div>
          <h2 className="text-4xl font-black text-dark tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join the Mission'}
          </h2>
          <p className="mt-2 text-gray-500 font-medium tracking-wide">
            {isLogin ? 'Login to manage your donations' : 'Create an account to start your journey'}
          </p>
        </motion.div>
      </div>

      <motion.div 
        {...({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, className: "mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10" } as any)}
      >
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 py-10 px-6 shadow-2xl shadow-gray-200/50 sm:rounded-3xl sm:px-12">
          <AnimatePresence mode="wait">
            <motion.form 
              {...({ 
                key: isLogin ? 'login' : 'signup',
                initial: { opacity: 0, x: 10 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -10 },
                className: "space-y-6",
                onSubmit: handleSubmit
              } as any)}
            >
              {error && (
                <motion.div 
                  {...({ 
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                    className: `p-4 text-sm font-bold rounded-2xl ${
                      error.includes('successful') 
                        ? 'bg-primary/20 text-primary border border-primary/20' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/20'
                    }`
                  } as any)}
                >
                  {error}
                </motion.div>
              )}
              
              <div className="space-y-4">
                <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-dark transition-colors" />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="name@example.com"
                      className="block w-full pl-12 pr-4 py-4 bg-cream border border-gray-200 rounded-2xl text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-dark transition-colors" />
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="block w-full pl-12 pr-4 py-4 bg-cream border border-gray-200 rounded-2xl text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                    />
                  </div>
                </div>

                {!isLogin && (
                  <motion.div 
                    {...({ 
                      initial: { opacity: 0, height: 0 },
                      animate: { opacity: 1, height: 'auto' },
                      className: "relative group space-y-4"
                    } as any)}
                  >
                    <div className="relative group mt-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2">Full Organization/Home Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-dark transition-colors" />
                        <input 
                          type="text" 
                          required={!isLogin} 
                          value={address} 
                          onChange={e => setAddress(e.target.value)} 
                          placeholder="e.g. 123 Baker Street, London"
                          className="block w-full pl-12 pr-4 py-4 bg-cream border border-gray-200 rounded-2xl text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2">Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-dark transition-colors" />
                        <input 
                          type="text" 
                          required={!isLogin} 
                          value={contact} 
                          onChange={e => setContact(e.target.value)} 
                          placeholder="+1 234 567 8900"
                          className="block w-full pl-12 pr-4 py-4 bg-cream border border-gray-200 rounded-2xl text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium" 
                        />
                      </div>
                    </div>

                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 mt-4">I am a...</label>
                    <div className="relative">
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-dark transition-colors" />
                      <select 
                        value={role} 
                        onChange={e => setRole(e.target.value)} 
                        className="block w-full pl-12 pr-10 py-4 bg-cream border border-gray-200 rounded-2xl text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="donor" className="bg-white text-dark">Donor (Restaurant, Supermarket)</option>
                        <option value="ngo" className="bg-white text-dark">NGO (Food Bank, Charity)</option>
                        <option value="admin" className="bg-white text-dark">Admin</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>

              <div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-4 bg-gradient-to-r from-primary to-primary-dark rounded-2xl shadow-lg shadow-primary/30 text-lg font-black text-white hover:translate-y-[-2px] hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Please Wait...' : isLogin ? (
                    <>
                      Sign In <LogIn className="ml-2 w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Create Account <UserPlus className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              className="text-sm font-bold text-primary-dark hover:text-primary transition-colors"
            >
              {isLogin ? "New to FoodShare? Create an account" : "Already registered? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
