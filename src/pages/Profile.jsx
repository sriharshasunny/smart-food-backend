import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import {
    User, Mail, Phone, MapPin, Save, LogOut, ChevronLeft,
    Camera, Check, Edit3, Package, Heart, Star,
    Shield, Clock, ChevronRight, Sparkles, Building, ListOrdered, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const FIELD_CSS = `
  .field-input {
    width: 100%; padding: 14px 16px 14px 52px;
    background: #fafafa; border: 1.5px solid #f0f0f0;
    border-radius: 14px; font-size: 14px; font-weight: 500; color: #111;
    outline: none; transition: all 0.2s;
  }
  .field-input:focus {
    background: #fff; border-color: #f97316;
    box-shadow: 0 0 0 4px rgba(249,115,22,0.08);
  }
  .field-input::placeholder { color: #ccc; }
  .field-input:read-only { background: #f5f5f5; color: #999; cursor: not-allowed; }
`;

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || ''
    });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || ''
            });
        }
    }, [user]);

    const handleImageUpload = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setAvatarPreview('REMOVE'); // Special flag to set default placeholder
    };

    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        if (e) e.preventDefault();
        let currentUser = user || (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
        if (!currentUser?._id) { alert('Please login again.'); return; }
        setSaving(true);
        try {
            const url = formData.email
                ? `${API_URL}/api/user/profile-by-email`
                : `${API_URL}/api/user/profile/${currentUser._id}`;
            
            // Handle image removal or update
            const finalImage = avatarPreview === 'REMOVE' 
                ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop" 
                : (avatarPreview || user?.profile_image);

            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: formData.name, 
                    email: formData.email, 
                    phone: formData.phone, 
                    address: formData.address,
                    city: formData.city,
                    profile_image: finalImage
                })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
                setSaved(true);
                if (avatarPreview === 'REMOVE') setAvatarPreview(null);
                setTimeout(() => setSaved(false), 2500);
            } else { alert(data.message || 'Update failed'); }
        } catch { alert('Network error'); }
        finally { setSaving(false); }
    };

    const handleLogout = async () => {
        try { await logout(); } catch {}
        navigate('/');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] pb-20 overflow-x-hidden">
            <style>{FIELD_CSS}</style>
            
            {/* Glossy Black Hero Section */}
            <div className="relative h-80 md:h-96 w-full overflow-hidden bg-[#0a0a0c]">
                {/* Geometric Glows (Strictly Orange/White) */}
                <div className="absolute top-[-40%] left-[-10%] w-[80%] h-[150%] bg-gradient-to-br from-orange-600/20 via-orange-500/5 to-transparent blur-[140px] rounded-full animate-pulse" />
                <div className="absolute top-10 right-20 w-32 h-32 bg-orange-500/10 blur-[80px]" />
                <div className="absolute -bottom-20 right-0 w-[50%] h-[100%] bg-gradient-to-tl from-white/5 to-transparent blur-[120px] rounded-full" />
                
                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8"
                    >
                        {/* Avatar Hub */}
                        <div className="relative group">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 to-orange-700 rounded-[2.8rem] blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-neutral-900 border-4 border-white overflow-hidden shadow-2xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <img
                                    src={avatarPreview === 'REMOVE' ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop" : (avatarPreview || user?.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop")}
                                    alt="Profile"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <Camera className="text-white w-7 h-7" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Update</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Remove Photo Action */}
                            <AnimatePresence>
                                {(avatarPreview || user?.profile_image) && avatarPreview !== 'REMOVE' && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-gray-900 rounded-full shadow-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20 border border-gray-100"
                                        title="Remove Photo"
                                    >
                                        <Trash2 size={14} />
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
                        </div>

                        <div className="text-center md:text-left flex-1 pb-2">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">Verified Identity</span>
                                <div className="h-1 w-12 bg-white/20 rounded-full" />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2">
                                {formData.name || "Explorer"}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10"><Mail className="w-3.5 h-3.5 text-orange-500/70" /> {formData.email}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-600 hidden md:block" />
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10"><Phone className="w-3.5 h-3.5 text-orange-500/70" /> {formData.phone || "No Connection"}</span>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
                            className="px-8 py-4 bg-orange-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-orange-600/30 hover:bg-orange-500 transition-all flex items-center gap-2 border border-orange-500/20"
                        >
                            Modify Profile <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                </div>
                
                {/* Modern Slant Cut */}
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#f8f9fc] to-transparent z-10" />
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
                {/* Left Side: Stats & Navigation */}
                <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
                    {/* Stats HUD */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 text-center md:text-left">Operational Snapshot</h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-orange-50 rounded-3xl p-6 text-center border border-orange-100 hover:scale-105 transition-transform">
                                <p className="text-3xl font-black text-orange-600 mb-1">12</p>
                                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Orders</p>
                            </div>
                            <div className="bg-black text-white rounded-3xl p-6 text-center shadow-lg hover:scale-105 transition-transform">
                                <p className="text-3xl font-black mb-1">4.8</p>
                                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Rank</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access List */}
                    <div className="bg-white rounded-[2.5rem] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
                        {[
                            { icon: ListOrdered, label: "Order History", link: "/orders" },
                            { icon: Heart, label: "Wishlist Area", link: "/wishlist" },
                            { icon: User, label: "Personal Config", active: true },
                            { icon: Shield, label: "Security & Keys" },
                            { icon: LogOut, label: "Terminate Session", color: "text-red-500", onClick: handleLogout }
                        ].map((item, idx) => (
                            <button
                                key={idx}
                                onClick={item.onClick || (() => item.link && navigate(item.link))}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${item.active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className={`w-5 h-5 ${item.active ? 'text-white' : item.color || 'text-gray-400 group-hover:text-orange-500'}`} />
                                    <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${item.active ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 ${item.active ? 'text-white' : 'text-gray-300 group-hover:text-orange-500'}`} />
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Right Side: Identity Form */}
                <motion.div variants={itemVariants} className="lg:col-span-8">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-white/50 relative overflow-hidden group">
                        {/* Animated Border Glow */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-500/10 transition-all duration-1000 rounded-[3rem]" />
                        {/* Form HUD Header */}
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <User className="w-6 h-6 text-orange-500" /> Identity Matrix
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authenticated Write</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            {/* Input Fields */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block">Name / Callsign</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                                    <input name="name" value={formData.name} onChange={handleChange} className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block">Mobile / Comm</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block">Base Sector / Address</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                                    <input name="address" value={formData.address} onChange={handleChange} className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block">City / Coordinate</label>
                                <div className="relative group">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                                    <input name="city" value={formData.city} onChange={handleChange} className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all" />
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-8 flex items-center justify-between border-t border-gray-50 mt-4">
                                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">
                                    Identity Verification Sequence Active
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={saving}
                                    type="submit"
                                    className={`relative px-12 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center gap-3
                                        ${saved 
                                            ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                                            : 'bg-gray-900 text-white hover:bg-orange-600 shadow-gray-900/10'}`}
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : saved ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {saving ? 'Processing...' : saved ? 'Credentials Saved' : 'Sync Identity'}
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Profile;
