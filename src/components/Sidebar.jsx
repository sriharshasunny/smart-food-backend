import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Sparkles, ShoppingBag, Heart, User, X, LogOut, Zap, Star, ChevronRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SIDEBAR_CSS = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* Glossy pill reflection */
  .glossy-pill::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 45%;
    background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%);
    border-radius: inherit;
    pointer-events: none;
  }

  @keyframes pill-glow {
    0%, 100% { box-shadow: 0 4px 20px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.25); }
    50%       { box-shadow: 0 4px 30px rgba(249,115,22,0.5), inset 0 1px 0 rgba(255,255,255,0.4); }
  }
  @keyframes pill-glow-space {
    0%, 100% { box-shadow: 0 4px 20px rgba(34,211,238,0.2), inset 0 1px 0 rgba(34,211,238,0.2); }
    50%       { box-shadow: 0 4px 30px rgba(34,211,238,0.4), inset 0 1px 0 rgba(34,211,238,0.4); }
  }
  .pill-glow       { animation: pill-glow 2.5s ease-in-out infinite; }
  .pill-glow-space { animation: pill-glow-space 2.5s ease-in-out infinite; }
`;

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const isSpaceTheme = location.pathname === '/recommendations';

    const menuItems = [
        { path: '/home',            icon: Home,       label: 'Home',        subtitle: 'Explore food & offers'     },
        { path: '/restaurants',     icon: MapPin,      label: 'Restaurants', subtitle: 'Find nearby places'         },
        { path: '/recommendations', icon: Sparkles,    label: 'AI Picks',    subtitle: 'Tailored just for you', isBeta: true },
        { path: '/orders',          icon: ShoppingBag, label: 'My Orders',   subtitle: 'Track & reorder'            },
        { path: '/wishlist',        icon: Heart,       label: 'Wishlist',    subtitle: 'Saved favourites'           },
        { path: '/profile',         icon: User,        label: 'Profile',     subtitle: 'Account & preferences'     },
    ];

    const handleLogout = async () => {
        try { await logout(); navigate('/'); }
        catch (error) { console.error('Logout failed', error); }
    };

    return (
        <>
            <style>{SIDEBAR_CSS}</style>

            {/* Backdrop - separate so sidebar stays mounted for layoutId */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="sidebar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={toggleSidebar}
                        className={`fixed inset-0 z-50 ${isSpaceTheme ? 'bg-black/70 backdrop-blur-md' : 'bg-black/40 backdrop-blur-sm'}`}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar — always mounted so layoutId persists across closes */}
            <div
                className={`fixed top-0 left-0 h-full w-[300px] z-[60] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className={`h-full w-full relative overflow-hidden shadow-2xl flex flex-col min-h-0 rounded-tr-[2rem] transition-colors duration-500
                    ${isSpaceTheme
                        ? 'bg-[#05050f]/97 backdrop-blur-[40px] border-r border-white/10'
                        : 'bg-white'
                    }`}
                >

                    {/* Space accent line on right edge */}
                    {isSpaceTheme && (
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent pointer-events-none" />
                    )}

                    {/* ── HEADER ── */}
                    <div className="relative shrink-0">
                        {/* Bottom divider */}
                        <div className={`absolute bottom-0 left-5 right-5 h-px ${isSpaceTheme ? 'bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-200 to-transparent'}`} />

                        <div className="p-5 pt-6 flex items-center justify-between">
                            <Link to="/home" onClick={toggleSidebar} className="flex items-center gap-3 group">
                                <div className={`p-2 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                                    ${isSpaceTheme
                                        ? 'bg-cyan-500/15 border border-cyan-500/40 shadow-cyan-500/20'
                                        : 'bg-gradient-to-tr from-orange-500 to-red-500 shadow-orange-500/30'}`}>
                                    <Zap className={`w-5 h-5 fill-current ${isSpaceTheme ? 'text-cyan-400' : 'text-white'}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-lg font-black tracking-tight leading-none ${isSpaceTheme ? 'text-white' : 'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'}`}>
                                        SmartFood
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5 ${isSpaceTheme ? 'text-cyan-400/60' : 'text-orange-400'}`}>
                                        {isSpaceTheme ? '// ai mode' : 'Delivery Platform'}
                                    </span>
                                </div>
                            </Link>

                            <button
                                onClick={toggleSidebar}
                                className={`p-2 rounded-full transition-all active:scale-90 ${isSpaceTheme ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                            >
                                <X className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* User greeting strip */}
                        {user && (
                            <div className={`mx-4 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 border transition-colors duration-500
                                ${isSpaceTheme
                                    ? 'bg-white/5 border-white/10'
                                    : 'bg-orange-50/80 border-orange-100'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all duration-500
                                    ${isSpaceTheme
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-sm'}`}>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-xs font-bold truncate ${isSpaceTheme ? 'text-white/90' : 'text-gray-800'}`}>
                                        Hey, {user?.name?.split(' ')[0] || 'there'}! 👋
                                    </span>
                                    <span className={`text-[10px] truncate ${isSpaceTheme ? 'text-white/35' : 'text-gray-400'}`}>
                                        {user?.email || 'Welcome back'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── NAVIGATION ── */}
                    <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 no-scrollbar">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    onClick={toggleSidebar}
                                    className="relative flex items-center gap-3 px-3 py-3 rounded-xl group overflow-hidden"
                                >
                                    {/* Glossy sliding active pill — layoutId works because sidebar stays mounted */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active-pill"
                                            className={`absolute inset-0 rounded-xl glossy-pill ${isSpaceTheme
                                                ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-700/30 border border-cyan-500/25 pill-glow-space'
                                                : 'bg-gradient-to-r from-orange-500 to-red-500 pill-glow'
                                            }`}
                                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        />
                                    )}

                                    {/* Hover bg */}
                                    {!isActive && (
                                        <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isSpaceTheme ? 'bg-white/5' : 'bg-gray-50'}`} />
                                    )}

                                    {/* Icon box */}
                                    <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300
                                        ${isActive
                                            ? isSpaceTheme ? 'bg-cyan-500/20' : 'bg-white/20'
                                            : isSpaceTheme ? 'bg-transparent group-hover:bg-white/5' : 'bg-transparent group-hover:bg-gray-100'
                                        }`}>
                                        <Icon className={`w-4 h-4 transition-all duration-300 ${isActive
                                            ? isSpaceTheme ? 'text-cyan-300' : 'text-white'
                                            : isSpaceTheme ? 'text-white/30 group-hover:text-white/70' : 'text-gray-400 group-hover:text-orange-500'
                                        }`} strokeWidth={isActive ? 2 : 1.5} />
                                    </div>

                                    {/* Text */}
                                    <div className="relative z-10 flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[13px] font-bold transition-all duration-300 ${isActive
                                                ? 'text-white'
                                                : isSpaceTheme ? 'text-white/50 group-hover:text-white/90' : 'text-gray-600 group-hover:text-gray-900'
                                            }`}>
                                                {item.label}
                                            </span>
                                            {item.isBeta && (
                                                <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-full border ${isActive
                                                    ? 'bg-white/20 border-white/20 text-white'
                                                    : 'bg-purple-500/15 border-purple-500/30 text-purple-400'}`}>
                                                    BETA
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-medium truncate transition-all duration-300 ${isActive
                                            ? 'text-white/60'
                                            : isSpaceTheme ? 'text-white/25 group-hover:text-white/45' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}>
                                            {item.subtitle}
                                        </span>
                                    </div>

                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="relative z-10 shrink-0"
                                        >
                                            <ChevronRight className="w-3.5 h-3.5 text-white/50" strokeWidth={2.5} />
                                        </motion.div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ── FOOTER ── */}
                    <div className={`p-4 shrink-0 border-t transition-colors duration-500 ${isSpaceTheme ? 'border-white/10' : 'border-gray-100'}`}>
                        {/* Premium card */}
                        <div className="relative mb-3 overflow-hidden rounded-2xl">
                            <div className={`absolute inset-0 p-[1.5px] rounded-2xl ${isSpaceTheme ? 'bg-gradient-to-br from-cyan-600 via-indigo-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500'}`}>
                                <div className={`h-full w-full rounded-[calc(1rem-1.5px)] ${isSpaceTheme ? 'bg-[#06060f]' : 'bg-gradient-to-br from-gray-900 to-gray-800'}`} />
                            </div>
                            <div className="relative p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <p className="text-sm font-bold text-white">Premium Member</p>
                                </div>
                                <p className="text-[10px] text-white/45 font-medium">Free delivery · Priority support</p>
                            </div>
                        </div>

                        {/* Logout btn */}
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full transition-all text-xs font-bold group ${isSpaceTheme ? 'text-white/30 hover:text-red-400 hover:bg-white/5' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                            Log Out
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default Sidebar;
