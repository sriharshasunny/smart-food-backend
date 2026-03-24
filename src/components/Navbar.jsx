import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, User, Heart, Mic, MicOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { motion, AnimatePresence } from 'framer-motion';
import useVoiceRecognition from '../hooks/useVoiceRecognition';

const NAV_CSS = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes shimmer-line {
    0%   { transform: translateX(-200%) skewX(-25deg); opacity: 0; }
    30%  { opacity: 0.6; }
    70%  { opacity: 0.6; }
    100% { transform: translateX(200%) skewX(-25deg); opacity: 0; }
  }
  @keyframes nav-dot-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.4); }
  }
  .nav-gradient-border {
    background-size: 200% 200%;
    animation: gradient-x 4s ease infinite;
  }
  .nav-shimmer::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    animation: shimmer-line 6s ease-in-out infinite 1s;
    border-radius: inherit;
    pointer-events: none;
  }
  .space-inner-bg {
    background-color: #06061a;
    background-image:
      radial-gradient(circle at 15% 50%, rgba(34,211,238,0.06) 0%, transparent 40%),
      radial-gradient(circle at 85% 50%, rgba(99,102,241,0.06) 0%, transparent 40%);
  }
  .space-bottom-glow {
    position: absolute;
    bottom: 0; left: 10%; right: 10%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(34,211,238,0.6), rgba(99,102,241,0.6), transparent);
    filter: blur(1px);
  }
  .nav-dot {
    animation: nav-dot-pulse 2s ease-in-out infinite;
  }
`;

const Navbar = ({ toggleSidebar }) => {
    const { cartCount, searchQuery, setSearchQuery } = useShop();
    const location = useLocation();
    const { user } = useAuth();

    const { isListening, supported, startListening, stopListening } = useVoiceRecognition(
        (finalCommandText) => setSearchQuery(finalCommandText),
        (interimText) => setSearchQuery(interimText)
    );

    const isSpaceTheme = location.pathname === '/recommendations';

    const navItems = [
        { path: '/home', label: 'Home' },
        { path: '/restaurants', label: 'Restaurants' },
        { path: '/recommendations', label: 'AI Picks', isBeta: true }
    ];

    return (
        <nav className="sticky top-0 z-50 transition-all duration-500 rounded-b-[1.5rem]">
            <style>{NAV_CSS}</style>

            {/* === BORDER LAYER === */}
            <div className={`absolute inset-0 rounded-b-[1.5rem] p-[1.5px] nav-gradient-border nav-shimmer overflow-hidden shadow-lg
                ${isSpaceTheme
                    ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 shadow-indigo-500/30'
                    : 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 shadow-purple-500/20'
                }`}
            >
                {/* Inner bg */}
                <div className={`h-full w-full rounded-b-[calc(1.5rem-1.5px)] transition-colors duration-500
                    ${isSpaceTheme ? 'space-inner-bg backdrop-blur-2xl' : 'bg-white'}`}
                />
                {/* AI Picks bottom glow */}
                {isSpaceTheme && <div className="space-bottom-glow" />}
            </div>

            {/* AI Picks: subtle top highlight */}
            {isSpaceTheme && (
                <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent z-20 pointer-events-none" />
            )}

            <div className="max-w-[1600px] mx-auto px-6 w-full relative z-10">
                <div className="flex justify-between items-center h-[54px] md:h-[70px] gap-4">

                    {/* LEFT: Toggle + Logo */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={toggleSidebar}
                            className={`p-1.5 -ml-2 rounded-full transition-all active:scale-95 ${isSpaceTheme ? 'hover:bg-white/8 text-white/70 hover:text-white' : 'hover:bg-black/5'}`}
                        >
                            <Menu className={`w-6 h-6 ${isSpaceTheme ? 'text-white/70' : 'text-gray-700'}`} strokeWidth={1.5} />
                        </button>

                        <Link to="/home" className="flex items-center gap-2.5 group cursor-pointer select-none">
                            <div className={`p-1.5 rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300 ${isSpaceTheme ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-gradient-to-tr from-orange-500 to-red-500 shadow-orange-500/20'}`}>
                                {isSpaceTheme
                                    ? <Sparkles className="w-4 h-4 text-cyan-400" />
                                    : <ShoppingBag className="w-4 h-4 text-white" />
                                }
                            </div>
                            {/* Desktop Logo */}
                            <div className="hidden sm:flex flex-col leading-none">
                                <span className={`text-lg md:text-xl font-black tracking-tighter transition-all duration-500 ${isSpaceTheme ? 'text-white' : 'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'}`}>
                                    SmartFood
                                </span>
                                {isSpaceTheme && (
                                    <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-cyan-400/70 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-cyan-400 rounded-full nav-dot" />
                                        AI Mode
                                    </span>
                                )}
                            </div>
                            {/* Mobile Page Title */}
                            <span className={`text-lg font-black sm:hidden tracking-tight capitalize ${isSpaceTheme ? 'text-white' : 'text-gray-800'}`}>
                                {location.pathname === '/home' ? 'Home' : location.pathname.split('/')[1] || 'SmartFood'}
                            </span>
                        </Link>
                    </div>

                    {/* CENTER: Navigation Links */}
                    <div className="hidden lg:flex items-center space-x-2 relative">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative px-5 py-2.5 group"
                            >
                                {/* Animated underline */}
                                {location.pathname === item.path && (
                                    <motion.div
                                        layoutId="navbar-active-line"
                                        className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${isSpaceTheme ? 'bg-gradient-to-r from-cyan-400 to-indigo-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <div className="flex items-center gap-1.5 z-10 relative">
                                    <span className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                                        location.pathname === item.path
                                            ? isSpaceTheme ? 'text-cyan-300' : 'text-gray-900'
                                            : isSpaceTheme ? 'text-white/40 group-hover:text-white/80' : 'text-gray-400 group-hover:text-gray-800'
                                    }`}>
                                        {item.label}
                                    </span>
                                    {item.isBeta && (
                                        <span className={`px-1.5 py-[2px] text-[9px] font-bold rounded-full transition-all duration-300 ${
                                            isSpaceTheme
                                                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                                                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm shadow-purple-500/20'
                                        }`}>
                                            BETA
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className="hidden xl:flex items-center relative group">
                            <div className={`absolute inset-0 rounded-full blur-[1px] opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 nav-gradient-border ${isListening ? 'bg-gradient-to-r from-red-400 via-orange-500 to-red-600' : isSpaceTheme ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600' : 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600'}`} />
                            <div className={`relative flex items-center rounded-full p-[2px] ${isSpaceTheme ? 'bg-[#08082a]' : 'bg-white'}`}>
                                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors z-10 ${isListening ? 'text-red-500' : isSpaceTheme ? 'text-white/30 group-focus-within:text-cyan-400' : 'text-gray-400 group-focus-within:text-orange-500'}`} strokeWidth={1.5} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-48 pl-10 ${supported ? 'pr-8' : 'pr-4'} py-1.5 rounded-full text-xs font-semibold focus:w-60 focus:ring-0 outline-none transition-all duration-300 relative z-10 ${isSpaceTheme ? 'bg-transparent text-white placeholder:text-white/30' : 'bg-gray-50 text-gray-900 focus:bg-white placeholder:text-gray-400'}`}
                                    placeholder={isListening ? 'Listening...' : 'Search food...'}
                                />
                                {supported && (
                                    <button
                                        onClick={isListening ? stopListening : startListening}
                                        className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-all flex items-center justify-center z-20 ${isListening ? 'bg-red-50 text-red-500 animate-pulse scale-110' : isSpaceTheme ? 'text-white/30 hover:text-cyan-400 hover:bg-white/10 hover:scale-110' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 hover:scale-110'}`}
                                        title={isListening ? 'Stop listening' : 'Search with voice'}
                                    >
                                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Wishlist */}
                        <Link to="/wishlist" className={`relative p-2.5 rounded-full transition-all group active:scale-95 ${isSpaceTheme ? 'hover:bg-white/8' : 'hover:bg-red-50'}`}>
                            <Heart className={`w-6 h-6 transition-colors ${isSpaceTheme ? 'text-white/50 group-hover:text-pink-400' : 'text-gray-600 group-hover:text-red-500'}`} strokeWidth={1.5} />
                        </Link>

                        {/* Cart */}
                        <Link to="/cart" className={`relative p-2.5 rounded-full transition-all group active:scale-95 ${isSpaceTheme ? 'hover:bg-white/8' : 'hover:bg-orange-50'}`}>
                            <ShoppingBag className={`w-6 h-6 transition-colors ${isSpaceTheme ? 'text-white/50 group-hover:text-cyan-400' : 'text-gray-600 group-hover:text-orange-600'}`} strokeWidth={1.5} />
                            {cartCount > 0 && (
                                <span className={`absolute top-1 right-0.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ${isSpaceTheme ? 'bg-cyan-500 text-black ring-[#06061a]' : 'bg-red-500 text-white ring-white'}`}>
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <div className={`w-px h-6 mx-1 hidden sm:block ${isSpaceTheme ? 'bg-white/10' : 'bg-gray-200'}`} />

                        {/* Profile */}
                        <Link
                            to="/profile"
                            className={`flex items-center gap-2.5 pl-1 pr-2 py-1 focus:outline-none rounded-full transition-all group ${isSpaceTheme ? 'hover:bg-white/8' : 'hover:bg-gray-50'}`}
                        >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${isSpaceTheme ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 ring-2 ring-cyan-500/20 group-hover:ring-cyan-500/40' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 ring-2 ring-white group-hover:ring-orange-100'}`}>
                                {user?.name?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" strokeWidth={1.5} />}
                            </div>
                            <div className="hidden xl:flex flex-col items-start leading-none gap-0.5">
                                <span className={`text-xs font-bold transition-colors ${isSpaceTheme ? 'text-white/80 group-hover:text-white' : 'text-gray-900 group-hover:text-orange-600'}`}>
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
