import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Sparkles, ShoppingBag, Heart, User, X, LogOut, Zap, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SIDEBAR_CSS = `
  .sidebar-glass {
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(30px) saturate(160%);
  }
  .sidebar-glass-dark {
    background: rgba(5, 5, 15, 0.96);
    backdrop-filter: blur(40px) saturate(180%);
  }
  .glossy-pill {
    background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%);
    border-top: 1px solid rgba(255,255,255,0.35);
    border-left: 1px solid rgba(255,255,255,0.25);
  }
  @keyframes slide-glow {
    0% { box-shadow: 0 0 20px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.3); }
    50% { box-shadow: 0 0 35px rgba(249,115,22,0.5), inset 0 1px 0 rgba(255,255,255,0.5); }
    100% { box-shadow: 0 0 20px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.3); }
  }
  @keyframes slide-glow-space {
    0% { box-shadow: 0 0 20px rgba(34,211,238,0.2), inset 0 1px 0 rgba(34,211,238,0.3); }
    50% { box-shadow: 0 0 40px rgba(34,211,238,0.4), inset 0 1px 0 rgba(34,211,238,0.5); }
    100% { box-shadow: 0 0 20px rgba(34,211,238,0.2), inset 0 1px 0 rgba(34,211,238,0.3); }
  }
  .active-glow { animation: slide-glow 2s ease-in-out infinite; }
  .active-glow-space { animation: slide-glow-space 2s ease-in-out infinite; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const isSpaceTheme = location.pathname === '/recommendations';

    const menuItems = [
        {
            path: '/home',
            icon: Home,
            label: 'Home',
            subtitle: 'Explore food & offers',
        },
        {
            path: '/restaurants',
            icon: MapPin,
            label: 'Restaurants',
            subtitle: 'Find nearby places',
        },
        {
            path: '/recommendations',
            icon: Sparkles,
            label: 'AI Picks',
            subtitle: 'Tailored just for you',
            isBeta: true,
        },
        {
            path: '/orders',
            icon: ShoppingBag,
            label: 'My Orders',
            subtitle: 'Track & reorder',
        },
        {
            path: '/wishlist',
            icon: Heart,
            label: 'Wishlist',
            subtitle: 'Saved favourites',
        },
        {
            path: '/profile',
            icon: User,
            label: 'Profile',
            subtitle: 'Account & settings',
        },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <>
            <style>{SIDEBAR_CSS}</style>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className={`fixed inset-0 z-50 ${isSpaceTheme ? 'bg-black/70 backdrop-blur-md' : 'bg-black/40 backdrop-blur-sm'}`}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="fixed top-0 left-0 h-full w-[300px] z-[60] shrink-0"
                    >
                        <div className={`h-full w-full relative overflow-hidden rounded-tr-[2rem] shadow-2xl flex flex-col ${isSpaceTheme ? 'sidebar-glass-dark border-r border-white/10' : 'sidebar-glass'}`}>

                            {/* === HEADER === */}
                            <div className="relative shrink-0">
                                {/* Animated gradient border at bottom of header */}
                                <div className={`absolute bottom-0 left-5 right-5 h-px ${isSpaceTheme ? 'bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-300/60 to-transparent'}`} />

                                <div className="p-5 pt-6 flex items-center justify-between">
                                    <Link to="/home" onClick={toggleSidebar} className="flex items-center gap-3 group">
                                        <div className={`p-2 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${isSpaceTheme ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-gradient-to-tr from-orange-500 to-red-500 shadow-orange-500/40'}`}>
                                            <Zap className={`w-5 h-5 fill-current ${isSpaceTheme ? 'text-cyan-400' : 'text-white'}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-lg font-black tracking-tight leading-none ${isSpaceTheme ? 'text-white' : 'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'}`}>
                                                SmartFood
                                            </span>
                                            <span className={`text-[9px] font-semibold uppercase tracking-widest mt-0.5 ${isSpaceTheme ? 'text-cyan-400/70' : 'text-orange-500'}`}>
                                                {isSpaceTheme ? '// AI Mode Active' : 'Delivery Platform'}
                                            </span>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={toggleSidebar}
                                        className={`p-2 rounded-full transition-all active:scale-90 ${isSpaceTheme ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                    >
                                        <X className="w-5 h-5" strokeWidth={1.5} />
                                    </button>
                                </div>

                                {/* User Greeting Strip */}
                                <div className={`mx-4 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 ${isSpaceTheme ? 'bg-white/5 border border-white/10' : 'bg-orange-50 border border-orange-100'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isSpaceTheme ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gradient-to-br from-orange-400 to-red-400 text-white shadow-sm'}`}>
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-xs font-bold truncate ${isSpaceTheme ? 'text-white' : 'text-gray-800'}`}>
                                            Hey, {user?.name?.split(' ')[0] || 'there'}! 👋
                                        </span>
                                        <span className={`text-[10px] truncate ${isSpaceTheme ? 'text-white/40' : 'text-gray-400'}`}>
                                            {user?.email || 'Welcome back'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* === NAVIGATION === */}
                            <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1 no-scrollbar">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.label}
                                            to={item.path}
                                            onClick={toggleSidebar}
                                            className="relative flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-200 group overflow-hidden"
                                        >
                                            {/* Glossy liquid active pill */}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="sidebar-active-pill"
                                                    className={`absolute inset-0 rounded-xl glossy-pill ${
                                                        isSpaceTheme
                                                            ? 'bg-gradient-to-r from-cyan-600/40 to-indigo-600/40 border border-cyan-500/30 active-glow-space'
                                                            : 'bg-gradient-to-r from-orange-500 to-red-500 active-glow'
                                                    }`}
                                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                                />
                                            )}

                                            {/* Hover state */}
                                            {!isActive && (
                                                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isSpaceTheme ? 'bg-white/5' : 'bg-gray-50'}`} />
                                            )}

                                            {/* Icon */}
                                            <div className={`relative z-10 p-1.5 rounded-lg shrink-0 transition-all duration-300 ${
                                                isActive
                                                    ? isSpaceTheme
                                                        ? 'bg-cyan-500/20 text-cyan-300'
                                                        : 'bg-white/20 text-white'
                                                    : isSpaceTheme
                                                        ? 'text-white/30 group-hover:text-white/70'
                                                        : 'text-gray-400 group-hover:text-orange-500'
                                            }`}>
                                                <Icon className="w-4.5 h-4.5" strokeWidth={isActive ? 2 : 1.5} />
                                            </div>

                                            {/* Label + Subtitle */}
                                            <div className="relative z-10 flex flex-col min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold transition-all duration-300 ${
                                                        isActive
                                                            ? 'text-white'
                                                            : isSpaceTheme
                                                                ? 'text-white/50 group-hover:text-white'
                                                                : 'text-gray-600 group-hover:text-gray-900'
                                                    }`}>
                                                        {item.label}
                                                    </span>
                                                    {item.isBeta && (
                                                        <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                                                            BETA
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] font-medium truncate transition-all duration-300 ${
                                                    isActive
                                                        ? 'text-white/70'
                                                        : isSpaceTheme
                                                            ? 'text-white/25 group-hover:text-white/50'
                                                            : 'text-gray-400 group-hover:text-gray-500'
                                                }`}>
                                                    {item.subtitle}
                                                </span>
                                            </div>

                                            {/* Active chevron */}
                                            {isActive && (
                                                <motion.div
                                                    initial={{ x: 5, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    className="relative z-10 shrink-0"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-white/60" strokeWidth={2} />
                                                </motion.div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* === FOOTER === */}
                            <div className={`p-4 shrink-0 border-t ${isSpaceTheme ? 'border-white/10' : 'border-gray-100'}`}>
                                {/* Premium Card */}
                                <div className="relative mb-3 overflow-hidden rounded-2xl">
                                    <div className={`absolute inset-0 ${isSpaceTheme ? 'bg-gradient-to-br from-cyan-900/60 via-indigo-900/60 to-purple-900/60' : 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500'} p-[1.5px] rounded-2xl`}>
                                        <div className={`h-full w-full rounded-[calc(1rem-1.5px)] ${isSpaceTheme ? 'bg-[#05050f]' : 'bg-gradient-to-br from-gray-900 to-gray-800'}`} />
                                    </div>
                                    <div className="relative p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                            <p className="text-sm font-bold text-white">Premium Member</p>
                                        </div>
                                        <p className="text-[11px] text-white/50">Free delivery · Priority support</p>
                                    </div>
                                </div>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full transition-all text-xs font-bold group ${isSpaceTheme ? 'text-white/30 hover:text-red-400 hover:bg-white/5' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                                >
                                    <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                                    Log Out
                                </button>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
