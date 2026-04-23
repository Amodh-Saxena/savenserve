// @ts-nocheck
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Heart, MapPin, Clock, ArrowRight, ShieldCheck, Users, 
  Leaf, Package, CheckCircle2, ChevronRight, Star, HeartHandshake, Globe, ExternalLink
} from 'lucide-react';
import NgoMap from '../components/NgoMap';

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const STAGGER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock data for NGO Listings (Chennai)
  const ngoListings = [
    { id: 1, name: "Bhumi", category: "Child Welfare", mission: "Education programs & volunteering", dist: "1.2 km", website: "https://bhumi.ngo/" },
    { id: 2, name: "United Way", category: "Rural Dev", mission: "Supports education & rural development", dist: "3.5 km", website: "https://unitedwaychennai.org/" },
    { id: 3, name: "Team Everest", category: "Education", mission: "Academic support & skill training", dist: "0.8 km", website: "https://www.teameverest.india/" },
  ];

  return (
    <div className="min-h-screen bg-cream font-sans text-dark selection:bg-primary/30">
      
      {/* 1. Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-black tracking-tight ${scrolled ? 'text-dark' : 'text-white'}`}>
                HopeRise
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className={`font-bold transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-dark' : 'text-white/80 hover:text-white'}`}>About</a>
              <a href="#how-it-works" className={`font-bold transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-dark' : 'text-white/80 hover:text-white'}`}>How It Works</a>
              <a href="#impact" className={`font-bold transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-dark' : 'text-white/80 hover:text-white'}`}>Impact</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/auth" className={`hidden sm:block font-bold ${scrolled ? 'text-dark hover:text-primary-dark' : 'text-white hover:text-white/80'} transition-colors`}>
                Login
              </Link>
              <Link to="/auth" className="bg-secondary text-white px-6 py-2.5 rounded-full font-black hover:shadow-xl hover:shadow-secondary/30 transition-all active:scale-95 shadow-md flex items-center gap-2">
                Donate Now
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-[90vh]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-dark/60 mix-blend-multiply z-10"></div>
          <motion.img 
            style={{ y: y1 }}
            src="https://images.unsplash.com/photo-1593113565214-80af84fce658?auto=format&fit=crop&q=80" 
            alt="Volunteers organizing food donations" 
            className="w-full h-[120%] object-cover object-center absolute -top-10"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.div initial="hidden" animate="visible" variants={STAGGER} className="max-w-4xl">
            <motion.div variants={FADE_UP} className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-sm font-bold mb-8 backdrop-blur-md">
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-ping mr-2.5"></span>
              Join the movement against food waste
            </motion.div>
            
            <motion.h1 variants={FADE_UP} className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] text-white mb-8">
              Reduce Waste. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary">Feed Lives.</span>
            </motion.h1>

            <motion.p variants={FADE_UP} className="text-xl md:text-2xl text-white/90 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Every day, perfectly good food is thrown away. Connect directly with communities in need and make an instant impact.
            </motion.p>

            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="flex items-center justify-center px-8 py-4 rounded-2xl bg-primary text-dark font-black text-lg hover:bg-primary-dark hover:text-white transition-all hover:-translate-y-1 shadow-xl shadow-primary/20">
                <Heart className="mr-2" size={20}/>
                Donate Food
              </Link>
              <Link to="/auth" className="flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-dark font-black text-lg hover:bg-gray-50 transition-all hover:-translate-y-1 shadow-lg">
                <Package className="mr-2" size={20}/>
                Request Food
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. Key Action Section */}
      <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 text-primary-dark">
              <Package size={32} />
            </div>
            <h3 className="text-3xl font-black text-dark mb-4 group-hover:text-primary transition-colors">I Have Food to Donate</h3>
            <p className="text-gray-500 font-medium text-lg mb-8 leading-relaxed">
              Restaurants, grocers, and events: Route your surplus perfectly edible food to those who truly need it in minutes.
            </p>
            <Link to="/auth" className="inline-flex items-center font-black text-primary-dark hover:text-primary transition-colors text-lg">
              Start Donating <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mb-8 text-secondary-dark">
              <Users size={32} />
            </div>
            <h3 className="text-3xl font-black text-dark mb-4 group-hover:text-secondary-dark transition-colors">I Want to Request Food</h3>
            <p className="text-gray-500 font-medium text-lg mb-8 leading-relaxed">
              NGOs, food banks, and shelters: Find available surplus food in your immediate area and secure it for pick up.
            </p>
            <Link to="/auth" className="inline-flex items-center font-black text-secondary-dark hover:text-secondary transition-colors text-lg">
              Browse Listings <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

>

      {/* 5. How It Works */}
      <section className="py-24 bg-white border-y border-gray-100" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-dark tracking-tight mb-6">How HopeRise Works</h2>
            <p className="text-xl text-gray-600 font-medium">A seamless platform bridging the gap between surplus food and those who need it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative text-center">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-primary-light via-secondary-light to-primary-light z-0"></div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP} className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-cream border-4 border-white shadow-xl flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-2 border-primary border-dashed animate-[spin_10s_linear_infinite]"></div>
                <Package size={48} className="text-primary-dark" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-dark text-white font-black flex items-center justify-center border-2 border-white">1</div>
              </div>
              <h3 className="text-2xl font-black text-dark mb-4">Post Donation</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Donors quickly snap a photo and list their surplus food details on the platform.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP} transition={{delay: 0.1}} className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-cream border-4 border-white shadow-xl flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-2 border-secondary border-dashed animate-[spin_10s_linear_infinite_reverse]"></div>
                <Users size={48} className="text-secondary-dark" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-dark text-white font-black flex items-center justify-center border-2 border-white">2</div>
              </div>
              <h3 className="text-2xl font-black text-dark mb-4">Instant Match</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Nearby NGOs or verified individuals receive alerts and can claim the food instantly.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP} transition={{delay: 0.2}} className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-cream border-4 border-white shadow-xl flex items-center justify-center mb-8 relative">
                 <div className="absolute inset-0 rounded-full border-2 border-primary border-dashed animate-[spin_10s_linear_infinite]"></div>
                <CheckCircle2 size={48} className="text-primary-dark" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-dark text-white font-black flex items-center justify-center border-2 border-white">3</div>
              </div>
              <h3 className="text-2xl font-black text-dark mb-4">Rescue & Impact</h3>
              <p className="text-gray-500 font-medium leading-relaxed">The beneficiary picks up the food, preventing waste and directly feeding the community.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MapmyIndia Integration Section */}
      <section className="py-24 bg-white border-y border-gray-100" id="nearby-ngos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-dark tracking-tight mb-6 flex items-center justify-center gap-3">
              <Globe className="text-primary" size={40} />
              NGOs near you, in Chennai
            </h2>
            <p className="text-xl text-gray-600 font-medium">Use our interactive map to see active community partners ready to rescue food in the region.</p>
          </div>
          
          <NgoMap ngos={[
            { id: "bhumi", name: "Bhumi", email: "contact@bhumi.ngo", location: "Education Programs", website: "https://bhumi.ngo/", lat: 13.0475, lng: 80.2089 },
            { id: "uwc", name: "United Way of Chennai", email: "info@unitedwaychennai.org", location: "Education & Rural Dev", website: "https://unitedwaychennai.org/", lat: 13.0368, lng: 80.2676 },
            { id: "everest", name: "Team Everest", email: "info@teameverest.india", location: "Academic & Skill Training", website: "https://www.teameverest.india/", lat: 13.0674, lng: 80.2376 },
            { id: "bluecross", name: "Blue Cross of India", email: "info@bluecrossofindia.org", location: "Animal Rescue & Shelter", website: "https://bluecrossofindia.org/", lat: 13.0033, lng: 80.2282 },
            { id: "sevalaya", name: "Sevalaya", email: "sevalaya@sevalaya.org", location: "Education & Healthcare", website: "https://sevalaya.org/", lat: 13.1492, lng: 80.0811 },
            { id: "ekam", name: "Ekam Foundation", email: "info@ekamfoundation.org", location: "Healthcare for Children", website: "https://www.ekamfoundation.org/", lat: 13.0405, lng: 80.2337 },
            { id: "efi", name: "EFI", email: "info@indiaenvironment.org", location: "Environmental Conservation", website: "https://indiaenvironment.org/", lat: 12.9815, lng: 80.2184 }
          ]} />



          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="space-y-6">
                <h4 className="text-2xl font-black text-dark flex items-center gap-3">
                    <span className="text-3xl">👶</span> Child Welfare & Education NGOs
                </h4>
                <div className="space-y-6">
                    <div className="group">
                        <a href="https://bhumi.ngo/" target="_blank" className="text-xl font-bold text-primary-dark hover:text-primary flex items-center gap-2 transition-colors">Bhumi <ExternalLink size={16}/></a>
                        <p className="text-gray-600 font-medium mt-1 italic">👉 Education programs & volunteering</p>
                    </div>
                    <div className="group">
                        <a href="https://unitedwaychennai.org/" target="_blank" className="text-xl font-bold text-primary-dark hover:text-primary flex items-center gap-2 transition-colors">United Way of Chennai <ExternalLink size={16}/></a>
                        <p className="text-gray-600 font-medium mt-1 italic">👉 Supports education, rural development & children welfare</p>
                    </div>
                    <div className="group">
                        <a href="https://www.teameverest.india/" target="_blank" className="text-xl font-bold text-primary-dark hover:text-primary flex items-center gap-2 transition-colors">Team Everest <ExternalLink size={16}/></a>
                        <p className="text-gray-600 font-medium mt-1 italic">👉 Academic support & skill training for students</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h4 className="text-2xl font-black text-dark flex items-center gap-3">
                    <span className="text-3xl">🐶</span> Animal Welfare NGOs
                </h4>
                <div className="space-y-6">
                    <div className="group">
                        <a href="https://bluecrossofindia.org/" target="_blank" className="text-xl font-bold text-secondary-dark hover:text-secondary flex items-center gap-2 transition-colors">Blue Cross of India <ExternalLink size={16}/></a>
                        <p className="text-gray-600 font-medium mt-1 italic">👉 Animal rescue, shelter, sterilization programs</p>
                    </div>
                </div>
                
                <h4 className="text-2xl font-black text-dark flex items-center gap-3 pt-4">
                    <span className="text-3xl">🌍</span> Social Impact & Community NGOs
                </h4>
                <div className="space-y-6">
                    <div className="group">
                        <a href="https://sevalaya.org/" target="_blank" className="text-xl font-bold text-primary-dark hover:text-primary flex items-center gap-2 transition-colors">Sevalaya <ExternalLink size={16}/></a>
                        <p className="text-gray-600 font-medium mt-1 italic">👉 Works in education, healthcare, and rural upliftment</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-6 mt-12">
                    <div className="group">
                        <a href="https://www.ekamfoundation.org/" target="_blank" className="text-xl font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-2 transition-colors">Ekam Foundation <ExternalLink size={16}/></a>
                        <p className="text-gray-600 font-medium mt-1 italic">👉 Healthcare support for children</p>
                    </div>
                    <div className="group">
                        <a href="https://indiaenvironment.org/" target="_blank" className="text-xl font-bold text-green-700 hover:text-green-500 flex items-center gap-2 transition-colors">Environmental Foundation of India <ExternalLink size={16}/></a>
                        <p className="text-gray-600 font-medium mt-1 italic">👉 Lake restoration, environmental conservation</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-dark tracking-tight mb-6">Voices of Impact</h2>
            <p className="text-xl text-gray-600 font-medium">Hear from the businesses and organizations making a difference.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP} className="bg-white rounded-3xl p-10 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">
               <div className="flex text-secondary mb-6">
                 {[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-current" />)}
               </div>
               <p className="text-xl font-medium text-gray-700 italic leading-relaxed mb-8 flex-1">
                 "Before HopeRise, we hated throwing away unsold bakery items at the end of the day. Now, they are picked up within an hour and go directly to a local shelter. It's incredibly fulfilling."
               </p>
               <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                 <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl shadow-sm">M</div>
                 <div>
                   <div className="font-black text-dark">Morning Bread Co.</div>
                   <div className="text-sm font-bold text-gray-500">Food Donor</div>
                 </div>
               </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-10 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">
               <div className="flex text-secondary mb-6">
                 {[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-current" />)}
               </div>
               <p className="text-xl font-medium text-gray-700 italic leading-relaxed mb-8 flex-1">
                 "The platform is completely seamless. We receive alerts when food is available nearby, saving us money and ensuring our community gets fresh, high-quality meals."
               </p>
               <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                 <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-black text-xl shadow-sm">S</div>
                 <div>
                   <div className="font-black text-dark">SafeHaven Shelter</div>
                   <div className="text-sm font-bold text-gray-500">NGO Partner</div>
                 </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Impact Stats Section */}
      <section className="py-24 bg-dark text-white relative overflow-hidden" id="impact">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-5xl font-black tracking-tight mb-6">Our Growing Impact</h2>
            <p className="text-xl text-gray-400 font-medium">Together, we are building a sustainable future where no good food gets left behind.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP} className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 text-primary">
                <Heart size={32} />
              </div>
              <div className="text-6xl font-black mb-2 tracking-tight">1.2M</div>
              <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">Meals Rescued</div>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP} transition={{delay: 0.1}} className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6 text-secondary">
                <ShieldCheck size={32} />
              </div>
              <div className="text-6xl font-black mb-2 tracking-tight">500+</div>
              <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">Partner NGOs</div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP} transition={{delay: 0.2}} className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 text-primary">
                <Leaf size={32} />
              </div>
              <div className="text-6xl font-black mb-2 tracking-tight">50k</div>
              <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">Kg CO2 Saved</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <HeartHandshake className="w-8 h-8 text-primary" />
                <span className="text-2xl font-black text-dark tracking-tight">HopeRise</span>
              </div>
              <p className="text-gray-500 font-medium max-w-sm leading-relaxed mb-6">
                Bridging the gap between excess and scarcity. We make it easy to donate surplus food and build a sustainable, hunger-free world.
              </p>
            </div>
            
            <div>
              <h4 className="font-black text-dark mb-6 tracking-wide">Platform</h4>
              <ul className="space-y-4">
                <li><Link to="/auth" className="text-gray-500 hover:text-primary font-medium transition-colors">Donate Food</Link></li>
                <li><Link to="/auth" className="text-gray-500 hover:text-primary font-medium transition-colors">Request Food</Link></li>
                <li><a href="#how-it-works" className="text-gray-500 hover:text-primary font-medium transition-colors">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-dark mb-6 tracking-wide">Connect</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-primary font-medium transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-500 hover:text-primary font-medium transition-colors">Twitter</a></li>
                <li><a href="#" className="text-gray-500 hover:text-primary font-medium transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-bold text-gray-400">
            <div>&copy; {new Date().getFullYear()} HopeRise Redistribution. All rights reserved.</div>
            <div className="space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-dark transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-dark transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
