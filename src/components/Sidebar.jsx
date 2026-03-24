import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Heart, ShoppingBag, Clock, Settings, Zap, X, LogOut, MapPin, Sparkles, User, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SIDEBAR_HUD_CSS = `
  @keyframes circuit-line {
    0% { top: -100%; }
    100% { top: 200%; }
  }
  @keyframes bracket-flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .sidebar-floating {
    margin: 1rem;
    height: calc(100vh - 2rem);
    border-radius: 1.5rem;
    perspective: 1000px;
    transform-style: preserve-3d;
  }
  .hud-corner {
    position: absolute; width: 10px; height: 10px;
    border-color: rgba(34, 211, 238, 0.4);
    pointer-events: none;
  }
  .hud-corner-tl { top: 10px; left: 10px; border-top: 1px solid; border-left: 1px solid; }
  .hud-corner-br { bottom: 10px; right: 10px; border-bottom: 1px solid; border-right: 1px solid; }
  .circuit-border {
    position: absolute;
    right: 0; top: 0; bottom: 0; width: 1px;
    background: rgba(34, 211, 238, 0.1);
    overflow: hidden;
  }
  .circuit-border::after {
    content: ''; position: absolute; left: 0; width: 100%; height: 100px;
    background: linear-gradient(to bottom, transparent, #22d3ee, transparent);
    animation: circuit-line 3s linear infinite;
  }
  .hud-bracket {
    font-family: monospace;
    color: #22d3ee;
    font-size: 1.2rem;
    animation: bracket-flicker 0.2s infinite;
  }
`;

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/home', icon: Home, label: 'Home' },
        { path: '/restaurants', icon: MapPin, label: 'Restaurants' },
        { path: '/recommendations', icon: Sparkles, label: 'AI Picks' },
        { path: '/orders', icon: ShoppingBag, label: 'Orders' },
        { path: '/wishlist', icon: Heart, label: 'Wishlist' },
        { path: '/profile', icon: User, label: 'Profile' },
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
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container - Floating Depth */}
            <motion.div
                className={`fixed top-0 left-0 z-[60] transform transition-all duration-500 ease-out ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                    } ${location.pathname === '/recommendations' ? 'sidebar-floating w-[300px]' : 'h-full w-[280px]'}`}
            >
                <style>{SIDEBAR_HUD_CSS}</style>
                <div className={`h-full w-full relative overflow-hidden shadow-2xl flex flex-col transition-all duration-500 ${location.pathname === '/recommendations' 
                    ? 'bg-[#0a0a14]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] scale-[1.01] hover:scale-[1.02] active:scale-[0.99]' 
                    : 'bg-white rounded-tr-2xl'}`}>

                    {location.pathname === '/recommendations' && (
                        <>
                            <div className="circuit-border" />
                            <div className="hud-corner hud-corner-tl" />
                            <div className="hud-corner hud-corner-br" />
                        </>
                    )}

                    {/* Header with HUD Border */}
                    <div className="relative shrink-0">
                        <div className={`absolute bottom-0 left-4 right-4 h-px ${location.pathname === '/recommendations' ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gray-100'}`} />
                        
                        <div className="relative p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 group">
                                <div className={`p-2 rounded-sm shadow-2xl transition-all duration-500 ${location.pathname === '/recommendations' ? 'bg-themeAccent-500/10 border border-themeAccent-500/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'bg-gradient-to-tr from-orange-500 to-red-500'}`}>
                                    <Zap className={`w-5 h-5 ${location.pathname === '/recommendations' ? 'text-themeAccent-400' : 'text-white'} fill-current`} />
                                </div>
                                <span className={`text-xl font-black uppercase tracking-tighter ${location.pathname === '/recommendations' ? 'text-white neon-text-cyan' : 'text-gray-900'}`}>
                                    SmartFood
                                </span>
                            </div>
                            <button
                                onClick={toggleSidebar}
                                className={`p-2 rounded-full transition-all active:scale-90 ${location.pathname === '/recommendations' ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                            >
                                <X className="w-6 h-6" strokeWidth={1} />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1 no-scrollbar">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    onClick={toggleSidebar}
                                    className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
                                >
                                    {/* HUD Active Indicator - Advanced */}
                                    {isActive && (
                                        <div className="absolute inset-0 z-0">
                                            {location.pathname === '/recommendations' ? (
                                                <div className="h-full w-full flex items-center justify-between px-2">
                                                    <motion.span initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hud-bracket">[</motion.span>
                                                    <motion.div 
                                                        layoutId="sidebar-active-hud-bg"
                                                        className="absolute inset-y-2 inset-x-8 bg-themeAccent-500/5 border-y border-themeAccent-500/20"
                                                    />
                                                    <motion.span initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hud-bracket">]</motion.span>
                                                </div>
                                            ) : (
                                                <motion.div
                                                    layoutId="sidebar-active-hud"
                                                    className="absolute inset-0 rounded-sm border-l-2 bg-orange-500/10 border-orange-500"
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Icon and Label */}
                                    <div className="relative flex items-center gap-4 w-full z-10 px-4">
                                        <Icon
                                            className={`w-4.5 h-4.5 transition-all duration-500 ${isActive
                                                ? (location.pathname === '/recommendations' ? 'text-themeAccent-400 scale-110' : 'text-white')
                                                : 'text-gray-400 group-hover:text-themeAccent-400'
                                                }`}
                                            strokeWidth={isActive ? 2 : 1.5}
                                        />
                                        <span
                                            className={`font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 ${isActive
                                                ? (location.pathname === '/recommendations' ? 'text-white neon-text-cyan' : 'text-white')
                                                : (location.pathname === '/recommendations' ? 'text-white/40 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900')
                                                }`}
                                        >
                                            {item.label}
                                        </span>
                                        {isActive && location.pathname === '/recommendations' && (
                                            <motion.div 
                                                className="ml-auto w-1 h-1 bg-themeAccent-400 rounded-full"
                                                animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer - Strategic Info */}
                    <div className={`p-5 border-t ${location.pathname === '/recommendations' ? 'border-white/5 bg-transparent' : 'border-gray-100 bg-gray-50/50'}`}>
                        {/* Premium Member Card - HUD Style */}
                        <div className="relative mb-6 overflow-hidden">
                            <div className={`absolute inset-0 opacity-20 ${location.pathname === '/recommendations' ? 'bg-themeAccent-500' : 'bg-gradient-to-br from-orange-400 to-red-500'}`} />
                            <div className={`relative p-4 border ${location.pathname === '/recommendations' ? 'border-themeAccent-500/30 bg-[#0a0a14]' : 'border-gray-200 bg-white shadow-sm'} rounded-sm`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${location.pathname === '/recommendations' ? 'bg-themeAccent-400' : 'bg-orange-500'}`} />
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${location.pathname === '/recommendations' ? 'text-white' : 'text-gray-900'}`}>Premium Tier</p>
                                </div>
                                <p className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">unlimited logistics active</p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm w-full transition-all text-[10px] font-black uppercase tracking-widest group ${location.pathname === '/recommendations' ? 'text-white/30 hover:text-red-400 hover:bg-white/5' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1} />
                            Terminate Session
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
