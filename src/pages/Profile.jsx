import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_URL } from '../config';
import { User, Mail, Phone, MapPin, Save, LogOut, ChevronLeft, Camera, Sparkles, Shield, Package, Heart, Star, Edit3, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || 'Detecting location...'
    });

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [editingField, setEditingField] = useState(null);

    // Fetch latest DB data
    useEffect(() => {
        if (user?._id) {
            fetch(`${API_URL}/api/user/${user._id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setFormData(prev => ({
                            ...prev,
                            name: data.user.name || prev.name,
                            email: data.user.email || prev.email,
                            phone: data.user.phone || prev.phone,
                            address: data.user.addresses?.find(a => a.isDefault)?.street || data.user.addresses?.[0]?.street || prev.address
                        }));
                    }
                })
                .catch(err => console.error("Failed to fetch profile:", err));
        }
    }, [user]);

    // Auto-fetch location if empty
    useEffect(() => {
        if (!formData.address || formData.address === 'Detecting location...') handleGetLocation();
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            if (formData.address === 'Detecting location...') setFormData(prev => ({ ...prev, address: '' }));
            return;
        }
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                    headers: { 'User-Agent': 'SmartFoodDeliveryApp/1.0' }
                });
                const data = await response.json();
                if (data.address) {
                    const addr = data.address;
                    const keys = ['amenity', 'house_number', 'road', 'suburb', 'city', 'town', 'state', 'postcode'];
                    const parts = [...new Set(keys.map(k => addr[k]).filter(Boolean))];
                    setFormData(prev => ({ ...prev, address: parts.join(', ') || data.display_name }));
                }
            } catch (error) { console.error('Geocoding error:', error); }
            finally { setLoadingLocation(false); }
        }, () => { setLoadingLocation(false); if (formData.address === 'Detecting location...') setFormData(prev => ({ ...prev, address: '' })); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        let currentUser = user;
        if (!currentUser || !currentUser._id) {
            const stored = localStorage.getItem('user');
            if (stored) try { currentUser = JSON.parse(stored); } catch { }
        }
        if (!currentUser?._id) { alert('Unable to identify user. Please login again.'); return; }

        setSaving(true);
        const payload = { name: formData.name, email: formData.email, phone: formData.phone, address: formData.address };
        try {
            const url = payload.email ? `${API_URL}/api/user/profile-by-email` : `${API_URL}/api/user/profile/${currentUser._id}`;
            const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } else { alert(data.message || 'Failed to update profile'); }
        } catch { alert('Error updating profile'); }
        finally { setSaving(false); }
    };

    const initials = formData.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    const stats = [
        { icon: Package, label: 'Orders', value: '24', color: 'text-orange-500', bg: 'bg-orange-50' },
        { icon: Heart,   label: 'Saved',  value: '12', color: 'text-pink-500',   bg: 'bg-pink-50'   },
        { icon: Star,    label: 'Points', value: '480', color: 'text-amber-500', bg: 'bg-amber-50'  },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 pb-20 pt-20">

            {/* Ambient glows */}
            <div className="fixed top-20 right-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 pointer-events-none" />
            <div className="fixed bottom-20 left-20 w-72 h-72 bg-rose-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-10 pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Header ── */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 mb-8">
                    <button onClick={() => navigate(-1)}
                        className="p-2.5 bg-white text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full shadow-sm border border-gray-100 transition-all active:scale-95">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Profile</h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Manage your account settings</p>
                    </div>
                </motion.div>

                {/* ── Hero Card ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative rounded-3xl overflow-hidden mb-6 shadow-xl shadow-orange-500/10">

                    {/* Hero gradient banner */}
                    <div className="h-36 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 relative">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwaDQydjQySDM2VjE4eiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvZz48L3N2Zz4=')] opacity-40" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                        {/* Edit banner hint */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            <Shield className="w-3 h-3 text-white/80" />
                            <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Premium Member</span>
                        </div>
                    </div>

                    {/* White content area */}
                    <div className="bg-white px-6 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 mb-6">

                            {/* Avatar */}
                            <div className="relative inline-block group">
                                <div className="w-28 h-28 rounded-2xl ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-black text-white">{initials}</span>
                                    )}
                                </div>
                                {/* Camera overlay */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <Camera className="w-6 h-6 text-white" />
                                        <span className="text-[9px] font-bold text-white uppercase tracking-wide">Change</span>
                                    </div>
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                {/* Online dot */}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                            </div>

                            {/* Name + email */}
                            <div className="flex-1 sm:ml-4 pb-1">
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">{formData.name || 'Your Name'}</h2>
                                <p className="text-sm text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />{formData.email}
                                </p>
                            </div>

                            {/* Sign out */}
                            <button onClick={logout}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100 hover:border-red-600 text-sm shrink-0">
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 mb-2">
                            {stats.map(({ icon: Icon, label, value, color, bg }) => (
                                <div key={label} className={`${bg} rounded-2xl p-3 text-center border border-white`}>
                                    <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                                    <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── Form Card ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">

                    <div className="px-6 pt-6 pb-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                                <Edit3 className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">Personal Information</h3>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">Update your details below</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-600 uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-focus-within:bg-orange-50 transition-colors">
                                        <User className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                    </div>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                                        className="w-full pl-14 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                                        placeholder="John Doe" />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-600 uppercase tracking-wider ml-1">Email <span className="text-gray-400 font-normal normal-case tracking-normal">(Read-only)</span></label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input type="email" name="email" value={formData.email} readOnly
                                        className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-600 uppercase tracking-wider ml-1">Phone Number</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-focus-within:bg-orange-50 transition-colors">
                                    <Phone className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                    className="w-full pl-14 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                                    placeholder="+91 98765 43210" />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Delivery Address</label>
                                <button type="button" onClick={handleGetLocation} disabled={loadingLocation}
                                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 border border-orange-100">
                                    <MapPin className="w-3 h-3" />
                                    {loadingLocation ? 'Locating...' : 'Auto Detect'}
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-4 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-focus-within:bg-orange-50 transition-colors">
                                    <MapPin className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <textarea name="address" value={formData.address} onChange={handleChange} rows="3"
                                    className="w-full pl-14 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none text-sm leading-relaxed shadow-sm block"
                                    placeholder="123 Main Street, City, Country" />
                            </div>
                        </div>

                        {/* Save button */}
                        <div className="pt-2">
                            <button type="submit" disabled={saving}
                                className={`w-full py-4 font-bold text-sm tracking-wide rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                                    saved
                                        ? 'bg-green-500 text-white shadow-green-500/25'
                                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5'
                                }`}>
                                {saved ? (
                                    <><Check className="w-4 h-4" />Saved Successfully!</>
                                ) : saving ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4" />Save Profile</>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;
