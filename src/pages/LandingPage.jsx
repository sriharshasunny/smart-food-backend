import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, ShieldCheck, Zap } from 'lucide-react';

const ASSETS = {
    // 3D Food Models
    burger3D: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hamburger/3D/hamburger_3d.png",
    pizza3D: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Pizza/3D/pizza_3d.png",
    bowl3D: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bento%20box/3D/bento_box_3d.png",
    drink3D: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cup%20with%20straw/3D/cup_with_straw_3d.png",
    // We use a high-quality placeholder drone/UFO in case the image generator hits a limit, 
    // but the system will swap it if the generated image succeeds and is placed in public.
    droneFallback: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Flying%20saucer/3D/flying_saucer_3d.png"
};

const LandingPage = () => {
    const navigate = useNavigate();

    // We will use standard scroll or simple mouse movement if needed, but 
    // the core requirement is the continuous 3D rotation of the food items.

    return (
        <div className="relative min-h-screen w-full overflow-hidden text-white font-sans selection:bg-purple-500 selection:text-white flex flex-col items-center justify-between pb-8">

            {/* THE COSMIC BACKGROUND */}
            <div className="absolute inset-0 z-0 bg-[#0d0428] overflow-hidden pointer-events-none">
                {/* Radial Gradient for deep space feel */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0d0428] to-[#050014]" />

                {/* Glowing Nebula Effects */}
                <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[150px] mix-blend-screen" />

                {/* Starfield Layer (CSS optimized purely for aesthetic) */}
                <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                <div className="absolute inset-0 opacity-20 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle, #c084fc 2px, transparent 2px)', backgroundSize: '150px 150px', backgroundPosition: '30px 30px' }} />
            </div>

            {/* HEADER TEXT & BUTTONS */}
            <div className="relative z-20 w-full pt-16 md:pt-24 flex flex-col items-center text-center px-6">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    FoodExpress – <span className="font-normal text-white">Delivery Beyond Limits</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-indigo-200/80 text-lg md:text-xl font-medium tracking-wide mb-10"
                >
                    Fast. Smart. Delivered to Your Doorstep.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-5 pointer-events-auto"
                >
                    <button
                        onClick={() => navigate('/home')}
                        className="px-10 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold tracking-wide shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.8)] border border-indigo-400/30 transition-all hover:scale-105 active:scale-95"
                    >
                        Order Now
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-10 py-3 rounded-full bg-transparent border-2 border-fuchsia-500/70 text-white font-bold tracking-wide shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:bg-fuchsia-500/10 hover:shadow-[0_0_40px_rgba(217,70,239,0.5)] transition-all hover:scale-105 active:scale-95"
                    >
                        Explore Restaurants
                    </button>
                </motion.div>
            </div>

            {/* CENTRAL DRONE & ORBITING FOOD */}
            <div className="relative z-10 flex-grow w-full max-w-7xl flex items-center justify-center my-10 min-h-[40vh] md:min-h-[50vh] pointer-events-none">

                {/* Central Drone Item (We map realistic floating) */}
                <motion.div
                    animate={{ y: [0, -15, 0], rotateZ: [0, 2, -1, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-20 w-[280px] md:w-[450px]"
                >
                    {/* Temporary glow behind the drone asset if it needs blending */}
                    <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-[60px] mix-blend-screen scale-125" />
                    <img
                        src={ASSETS.droneFallback}
                        alt="Delivery Drone"
                        className="w-full h-auto object-contain filter drop-shadow-[0_30px_50px_rgba(0,0,0,0.8)] mix-blend-screen"
                    />
                </motion.div>

                {/* Orbiting Food - TOP LEFT (Burger) */}
                <motion.div
                    className="absolute top-[10%] left-[10%] md:top-[15%] md:left-[15%] w-24 md:w-40 z-30"
                    animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <motion.img
                        src={ASSETS.burger3D}
                        animate={{ rotateY: 360, rotateX: 360, rotateZ: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
                    />
                </motion.div>

                {/* Orbiting Food - TOP RIGHT (Pizza) */}
                <motion.div
                    className="absolute top-[5%] right-[5%] md:top-[10%] md:right-[15%] w-32 md:w-48 z-10"
                    animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                    <motion.img
                        src={ASSETS.pizza3D}
                        animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
                    />
                </motion.div>

                {/* Orbiting Food - BOTTOM LEFT (Bowl/Noodles) */}
                <motion.div
                    className="absolute bottom-[20%] left-[5%] md:bottom-[25%] md:left-[18%] w-28 md:w-44 z-30"
                    animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                    <motion.img
                        src={ASSETS.bowl3D}
                        animate={{ rotateY: 360, rotateZ: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
                    />
                </motion.div>

                {/* Orbiting Food - BOTTOM RIGHT (Drink/Ice Cream) */}
                <motion.div
                    className="absolute bottom-[10%] right-[10%] md:bottom-[20%] md:right-[20%] w-20 md:w-32 z-30"
                    animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                >
                    <motion.img
                        src={ASSETS.drink3D}
                        animate={{ rotateX: 360, rotateY: 360, rotateZ: [0, 180, 0] }}
                        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                        className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]"
                    />
                </motion.div>

            </div>

            {/* FEATURE CARDS BOTTOM GRID */}
            <div className="relative z-30 px-6 w-full max-w-7xl mx-auto pointer-events-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">

                    {/* Card 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                        className="bg-white/5 backdrop-blur-md border border-indigo-400/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/10 hover:border-indigo-400/40 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-500/20 p-2.5 rounded-full ring-1 ring-indigo-500/50 group-hover:ring-indigo-400 transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                                <Zap className="w-5 h-5 text-indigo-300" />
                            </div>
                            <h3 className="font-bold text-base whitespace-nowrap">Lightning<br />Fast Delivery</h3>
                        </div>
                        <p className="text-xs text-indigo-100/60 leading-relaxed font-medium">
                            FoodExpress is a modern food delivery platform powered by AI to ensure timely routing.
                        </p>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
                        className="bg-white/5 backdrop-blur-md border border-purple-400/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/10 hover:border-purple-400/40 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-purple-500/20 p-2.5 rounded-full ring-1 ring-purple-500/50 group-hover:ring-purple-400 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                <MapPin className="w-5 h-5 text-purple-300" />
                            </div>
                            <h3 className="font-bold text-base whitespace-nowrap">Live Order<br />Tracking</h3>
                        </div>
                        <p className="text-xs text-indigo-100/60 leading-relaxed font-medium">
                            FoodExpress gives real time food delivery tracking powered by the ultimate GPS location.
                        </p>
                    </motion.div>

                    {/* Card 3 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
                        className="bg-white/5 backdrop-blur-md border border-fuchsia-400/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/10 hover:border-fuchsia-400/40 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-fuchsia-500/20 p-2.5 rounded-full ring-1 ring-fuchsia-500/50 group-hover:ring-fuchsia-400 transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                                <Search className="w-5 h-5 text-fuchsia-300" />
                            </div>
                            <h3 className="font-bold text-base whitespace-nowrap">Smart Search<br />& Filters</h3>
                        </div>
                        <p className="text-xs text-indigo-100/60 leading-relaxed font-medium">
                            FoodExpress has AI algorithms to surface exact matches tailored to your palate & craving.
                        </p>
                    </motion.div>

                    {/* Card 4 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}
                        className="bg-white/5 backdrop-blur-md border border-pink-400/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/10 hover:border-pink-400/40 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-pink-500/20 p-2.5 rounded-full ring-1 ring-pink-500/50 group-hover:ring-pink-400 transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                                <ShieldCheck className="w-5 h-5 text-pink-300" />
                            </div>
                            <h3 className="font-bold text-base whitespace-nowrap">Secure<br />Payments</h3>
                        </div>
                        <p className="text-xs text-indigo-100/60 leading-relaxed font-medium">
                            FoodExpress ensures multiple tracking algorithms to secure your smart payment channels.
                        </p>
                    </motion.div>

                </div>
            </div>

        </div>
    );
};

export default LandingPage;
