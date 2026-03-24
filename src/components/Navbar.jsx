import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, User, Heart, Zap, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_HUD_CSS = `
  @keyframes energy-shimmer {
    0% { transform: translateX(-100%) skewX(-45deg); opacity: 0; }
    20% { opacity: 0.5; }
    50% { opacity: 0.8; }
    80% { opacity: 0.5; }
    100% { transform: translateX(200%) skewX(-45deg); opacity: 0; }
  }
  @keyframes logo-pulse {
    0%, 100% { filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.4)); }
    50% { filter: drop-shadow(0 0 15px rgba(34, 211, 238, 0.8)); }
  }
  .hud-energy-line {
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, #22d3ee, transparent);
    overflow: hidden;
  }
  .hud-energy-line::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
    animation: energy-shimmer 4s ease-in-out infinite;
  }
  .nav-perspective {
    perspective: 1000px;
  }
  .nav-tilt {
    transform: rotateX(2deg);
    transform-origin: top;
  }
  .neon-text-cyan {
    text-shadow: 0 0 10px rgba(34, 211, 238, 0.5), 0 0 2px rgba(34, 211, 238, 0.8);
  }
`;

const Navbar = ({ toggleSidebar }) => {
    const { cartCount, searchQuery, setSearchQuery } = useShop();
    const location = useLocation();

    // Use Global Auth
    const { user } = useAuth();

    const navItems = [
        { path: '/home', label: 'Home' },
        { path: '/restaurants', label: 'Restaurants' },
        { path: '/recommendations', label: 'AI Picks', isBeta: true }
    ];

    return (
        <nav className="sticky top-0 z-50 transition-all duration-500 nav-perspective">
            <style>{NAV_HUD_CSS}</style>
            {/* 1. HUD Border Layer - Enhanced Depth */}
            <div className={`absolute inset-0 rounded-b-2xl nav-tilt ${location.pathname === '/recommendations' ? 'bg-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 animate-gradient-x'} p-[1px]`}>
                {/* 2. Inner Background Layer */}
                <div className={`h-full w-full ${location.pathname === '/recommendations' ? 'bg-[#0a0a14]/90 backdrop-blur-3xl saturate-150' : 'bg-white'} rounded-b-[calc(1rem-1px)]`}></div>
                
                {/* 3. Energy Shimmer Line */}
                {location.pathname === '/recommendations' && (
                    <div className="hud-energy-line opacity-50" />
                )}
            </div>

            <div className="max-w-[1600px] mx-auto px-6 w-full relative z-10">
                {/* Reduced height by ~10px: h-16/20 -> h-[54px] md:h-[70px] */}
                <div className="flex justify-between items-center h-[54px] md:h-[70px] gap-4">

                    {/* LEFT: Toggle, Logo */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={toggleSidebar}
                            className={`p-1.5 -ml-2 rounded-full transition-all active:scale-95 ${location.pathname === '/recommendations' ? 'hover:bg-white/5 text-white/70' : 'hover:bg-black/5 text-gray-700'}`}
                        >
                            <Menu className="w-6 h-6" strokeWidth={1} />
                        </button>

                        <Link to="/home" className="flex items-center gap-3 group cursor-pointer select-none">
                            <div className={`p-2 rounded-sm shadow-xl transition-all duration-500 relative overflow-hidden ${location.pathname === '/recommendations' 
                                ? 'bg-themeAccent-500/10 border border-themeAccent-500/40 animate-[logo-pulse_3s_infinite]' 
                                : 'bg-gradient-to-tr from-orange-500 to-red-500'}`}>
                                <ShoppingBag className={`w-4 h-4 relative z-10 ${location.pathname === '/recommendations' ? 'text-themeAccent-400' : 'text-white'}`} />
                                {location.pathname === '/recommendations' && (
                                    <div className="absolute inset-x-0 h-px bg-themeAccent-400/50 bottom-0 animate-pulse" />
                                )}
                            </div>
                            {/* Desktop Logo */}
                            <span className={`text-lg md:text-xl font-black uppercase tracking-tighter hidden sm:block transition-all duration-500 ${location.pathname === '/recommendations' ? 'text-white neon-text-cyan' : 'text-gray-900 group-hover:text-orange-600'}`}>
                                Smart<span className={location.pathname === '/recommendations' ? 'text-themeAccent-400' : 'text-orange-500'}>Food</span>
                            </span>
                            {/* Mobile Page Title */}
                            <span className={`text-lg font-black tracking-tight capitalize sm:hidden ${location.pathname === '/recommendations' ? 'text-white' : 'text-gray-800'}`}>
                                {location.pathname === '/home' ? 'Home' : location.pathname.split('/')[1] || 'SmartFood'}
                            </span>
                        </Link>
                    </div>

                    {/* CENTER: Navigation Links (Desktop) with HUD Underline */}
                    <div className="hidden lg:flex items-center space-x-1 relative">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative px-5 py-2 group"
                            >
                                {location.pathname === item.path && (
                                    <motion.div
                                        layoutId="navbar-hud-underline"
                                        className={`absolute bottom-0 left-2 right-2 h-[2px] rounded-full overflow-hidden ${location.pathname === '/recommendations' ? 'bg-themeAccent-500/20' : 'bg-orange-500'}`}
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    >
                                        {location.pathname === '/recommendations' && (
                                            <motion.div 
                                                className="absolute inset-0 bg-themeAccent-400 shadow-[0_0_15px_#22d3ee]"
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            />
                                        )}
                                    </motion.div>
                                )}
                                <div className="flex items-center gap-2 z-10 relative">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${location.pathname === item.path 
                                        ? (location.pathname === '/recommendations' ? 'text-themeAccent-400 neon-text-cyan' : 'text-gray-900') 
                                        : (location.pathname === '/recommendations' ? 'text-white/40 group-hover:text-white group-hover:translate-y-[-1px]' : 'text-gray-400 group-hover:text-gray-800')
                                        }`}>
                                        {item.label}
                                    </span>
                                    {item.isBeta && (
                                        <div className="relative">
                                            <span className={`px-1.5 py-[1px] text-[8px] font-black rounded-sm border transition-all duration-500 ${location.pathname === '/recommendations' ? 'border-themeAccent-500/40 text-themeAccent-400 bg-themeAccent-500/5 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm shadow-purple-500/20'}`}>
                                                BETA
                                            </span>
                                            {location.pathname === '/recommendations' && (
                                                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-themeAccent-400 rounded-full animate-ping opacity-75" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search Bar - Strategic HUD */}
                        <div className="hidden xl:flex items-center relative group">
                            {location.pathname !== '/recommendations' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 rounded-full blur-[1px] opacity-70 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 animate-gradient-x" />
                            )}
                            <div className={`relative flex items-center rounded-full p-[1px] ${location.pathname === '/recommendations' ? 'bg-white/10 border border-white/5' : 'bg-white'}`}>
                                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors z-10 ${location.pathname === '/recommendations' ? 'text-white/30 group-focus-within:text-themeAccent-400' : 'text-gray-400 group-focus-within:text-orange-500'}`} strokeWidth={1} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-40 pl-10 pr-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest focus:w-56 focus:ring-0 outline-none transition-all duration-500 placeholder:text-gray-500 relative z-10 ${location.pathname === '/recommendations' ? 'bg-transparent text-white' : 'bg-gray-50 text-gray-900 focus:bg-white'}`}
                                    placeholder="Execute search..."
                                />
                            </div>
                        </div>

                        <Link to="/wishlist" className={`relative p-2.5 rounded-full transition-all group active:scale-95 ${location.pathname === '/recommendations' ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-red-50 text-gray-600 hover:text-red-500'}`}>
                            <Heart className="w-5 h-5" strokeWidth={1} />
                        </Link>

                        <Link to="/cart" className={`relative p-2.5 rounded-full transition-all group active:scale-95 ${location.pathname === '/recommendations' ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-orange-50 text-gray-600 hover:text-orange-600'}`}>
                            <ShoppingBag className="w-5 h-5" strokeWidth={1} />
                            {cartCount > 0 && (
                                <span className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 text-[8px] font-black rounded-sm flex items-center justify-center shadow-md ${location.pathname === '/recommendations' ? 'bg-themeAccent-500 text-black' : 'bg-red-500 text-white ring-2 ring-white'}`}>
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

                        <Link
                            to="/profile"
                            className={`flex items-center gap-2.5 pl-1 pr-2 py-1 focus:outline-none rounded-full transition-all group ${location.pathname === '/recommendations' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                        >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${location.pathname === '/recommendations' ? 'bg-white/5 text-white border border-white/10' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 shadow-sm ring-2 ring-white group-hover:ring-orange-100'}`}>
                                <User className="w-5 h-5" strokeWidth={1} />
                            </div>
                            <div className="hidden xl:flex flex-col items-start leading-none gap-0.5">
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${location.pathname === '/recommendations' ? 'text-white/60 group-hover:text-white' : 'text-gray-900 group-hover:text-orange-600'}`}>
                                    {user?.name?.split(' ')[0] || 'Profile'}
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
