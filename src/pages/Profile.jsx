import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import {
    User, Mail, Phone, MapPin, Save, LogOut, ChevronLeft,
    Camera, Check, Edit3, Package, Heart, Star,
    Shield, Clock, ChevronRight, Sparkles
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

/* ── Field Component ─────────────────────────────────────────────────── */
const Field = ({ label, icon: Icon, badge, children }) => (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">{label}</label>
            {badge}
        </div>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Icon className="w-4 h-4 text-gray-300" />
            </div>
            {children}
        </div>
    </div>
);

/* ── Main Page ───────────────────────────────────────────────────────── */
const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders'

    /* Fetch profile */
    useEffect(() => {
        if (!user?._id) return;
        fetch(`${API_URL}/api/user/${user._id}`)
            .then(r => r.json())
            .then(data => {
                if (data.user) setFormData(prev => ({
                    ...prev,
                    name: data.user.name || prev.name,
                    email: data.user.email || prev.email,
                    phone: data.user.phone || prev.phone,
                    address: data.user.addresses?.find(a => a.isDefault)?.street || data.user.addresses?.[0]?.street || prev.address
                }));
            }).catch(() => {});
    }, [user]);

    /* Auto-detect address once */
    useEffect(() => {
        if (!formData.address) handleGetLocation();
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) return;
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            try {
                const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`, { headers: { 'User-Agent': 'SmartFoodApp/1' } });
                const d = await r.json();
                if (d.address) {
                    const a = d.address;
                    const parts = [...new Set(['road','suburb','city','town','state','postcode'].map(k => a[k]).filter(Boolean))];
                    setFormData(prev => ({ ...prev, address: parts.join(', ') || d.display_name }));
                }
            } catch {} finally { setLoadingLocation(false); }
        }, () => setLoadingLocation(false), { enableHighAccuracy: true, timeout: 10000 });
    };

    const handleImageChange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        let currentUser = user || (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
        if (!currentUser?._id) { alert('Please login again.'); return; }
        setSaving(true);
        try {
            const url = formData.email
                ? `${API_URL}/api/user/profile-by-email`
                : `${API_URL}/api/user/profile/${currentUser._id}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, address: formData.address })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } else { alert(data.message || 'Update failed'); }
        } catch { alert('Network error'); }
        finally { setSaving(false); }
    };

    const handleLogout = async () => {
        try { await logout(); } catch {}
        navigate('/');
    };

    const initials = formData.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'Valued Member';

    return (
        <div className="min-h-screen bg-[#f7f7f9] pb-20">
            <style>{FIELD_CSS}</style>

            {/* ── Top Hero Banner ── */}
            <div className="relative h-52 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500" />
                {/* Mesh overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <path d="M0,100 C200,0 600,200 800,100 L800,200 L0,200Z" fill="white" />
                </svg>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />

                {/* Back + title */}
                <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-6">
                    <button onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-bold">
                        <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">My Account</span>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-24 pb-8 relative z-10">

                {/* Avatar card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-3xl shadow-xl shadow-black/8 border border-white p-6 mb-4">

                    <div className="flex items-end gap-5 mb-5">
                        {/* Avatar */}
                        <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                    : <span className="text-3xl font-black text-white">{initials}</span>}
                            </div>
                            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-orange-500 border-2 border-white flex items-center justify-center shadow-md">
                                <Edit3 className="w-3 h-3 text-white" />
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </div>

                        {/* Name / email / joined */}
                        <div className="flex-1 min-w-0 pb-1">
                            <h1 className="text-xl font-black text-gray-900 leading-tight truncate">{formData.name || 'Your Name'}</h1>
                            <p className="text-sm text-gray-400 font-medium truncate mt-0.5">{formData.email}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <Clock className="w-3 h-3 text-gray-300" />
                                <span className="text-[11px] text-gray-400 font-medium">Member since {memberSince}</span>
                            </div>
                        </div>

                        {/* Sign out */}
                        <button onClick={handleLogout}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-100 hover:border-red-500 font-bold text-xs uppercase tracking-wider transition-all duration-300 group">
                            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            Sign Out
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mb-5" />

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: Package, label: 'Orders', value: '24', accent: '#f97316' },
                            { icon: Heart,   label: 'Saved',  value: '12', accent: '#ec4899' },
                            { icon: Star,    label: 'Reviews', value: '8', accent: '#f59e0b' },
                        ].map(({ icon: Icon, label, value, accent }) => (
                            <div key={label} className="flex flex-col items-center justify-center py-3 rounded-2xl bg-gray-50 border border-gray-100/80 hover:bg-gray-100 transition-colors cursor-pointer">
                                <Icon className="w-4 h-4 mb-1" style={{ color: accent }} />
                                <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Form card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-3xl shadow-xl shadow-black/8 border border-white overflow-hidden">

                    {/* Card header */}
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                            <User className="w-4.5 h-4.5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900">Personal Details</h2>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Update your info and delivery address</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Full Name" icon={User}>
                                <input type="text" name="name" value={formData.name} onChange={handleChange}
                                    className="field-input" placeholder="John Doe" />
                            </Field>
                            <Field label="Email" icon={Mail} badge={<span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Read-only</span>}>
                                <input type="email" name="email" value={formData.email} readOnly
                                    className="field-input" />
                            </Field>
                        </div>

                        <Field label="Phone" icon={Phone}>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                className="field-input" placeholder="+91 98765 43210" />
                        </Field>

                        <Field label="Delivery Address" icon={MapPin}
                            badge={
                                <button type="button" onClick={handleGetLocation} disabled={loadingLocation}
                                    className="flex items-center gap-1 text-[9px] font-black text-orange-500 hover:text-orange-600 uppercase tracking-wider disabled:opacity-50">
                                    <MapPin className="w-3 h-3" />{loadingLocation ? 'Locating…' : 'Auto-detect'}
                                </button>
                            }>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows="2"
                                className="field-input resize-none" style={{ paddingTop: 14, paddingBottom: 14 }}
                                placeholder="123 Main Street, City, Country" />
                        </Field>

                        {/* Save */}
                        <div className="pt-2">
                            <button type="submit" disabled={saving}
                                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                                    saved
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5'
                                }`}>
                                {saved ? (
                                    <><Check className="w-4 h-4" />Saved!</>
                                ) : saving ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                                ) : (
                                    <><Save className="w-4 h-4" />Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Quick nav links */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4 grid grid-cols-2 gap-3">
                    {[
                        { label: 'My Orders', sub: 'Track & reorder', to: '/orders', icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
                        { label: 'AI Picks',  sub: 'Tailored for you', to: '/recommendations', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50' },
                    ].map(({ label, sub, to, icon: Icon, color, bg }) => (
                        <Link key={to} to={to}
                            className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all group active:scale-[0.98]">
                            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-gray-900">{label}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{sub}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;
