import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, Users, Shield, Heart, Scale } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
      total_items_saved: 0,
      total_kgs_saved: 0,
      status_distribution: []
  });

  useEffect(() => {
    api.get('/users/')
       .then(res => setUsers(res.data))
       .catch(e => console.error(e));
       
    api.get('/foods/stats')
       .then(res => setStats(res.data))
       .catch(e => console.error(e));
  }, []);

  const COLORS = ['#84cc16', '#f59e0b', '#eab308']; // Olive, Saffron, Yellow

  return (
    <div className="min-h-screen bg-cream font-sans text-dark transition-colors duration-500">
      <nav className="bg-white border-b border-gray-200 text-dark shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <h1 className="text-xl font-black flex items-center gap-2"><Shield className="text-primary"/> Admin Panel</h1>
          <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-2 rounded-full"><LogOut size={20}/></button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total System Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
            </div>
            
            <div className="bg-primary rounded-xl shadow-lg shadow-primary/20 border border-primary-light p-6 flex items-center gap-4 text-white hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Heart size={24} />
                </div>
                <div>
                    <p className="text-sm text-primary-light font-bold uppercase tracking-widest">Total Food Saved</p>
                    <p className="text-3xl font-black">{stats.total_items_saved || 0} <span className="text-lg font-medium opacity-80">items</span></p>
                </div>
            </div>

            <div className="bg-secondary rounded-xl shadow-lg shadow-secondary/20 border border-secondary-light p-6 flex items-center gap-4 text-white hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Scale size={24} />
                </div>
                <div>
                    <p className="text-sm text-secondary-light font-bold uppercase tracking-widest">Total Weight Saved</p>
                    <p className="text-3xl font-black">{stats.total_kgs_saved || 0} <span className="text-lg font-medium opacity-80">kgs</span></p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 col-span-1 lg:col-span-1">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Food Listing Status</h3>
                <div className="h-64 w-full">
                    {stats.status_distribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.status_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.status_distribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [`${value} listings`, 'Count']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">No data available</div>
                    )}
                </div>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-xl border border-gray-200 col-span-1 lg:col-span-2">
                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">User Directory</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1"><Users size={14}/> Total: {users.length}</span>
                </div>
                <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                    {users.map(u => (
                        <li key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold uppercase shrink-0 ${u.role === 'donor' ? 'bg-primary' : u.role === 'ngo' ? 'bg-secondary' : 'bg-dark'}`}>
                                    {u.email[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{u.name || u.email}</p>
                                    <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-sm text-gray-500 capitalize px-3 py-1 bg-gray-100 rounded-full">{u.role}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </main>
    </div>
  );
}
