// ... existing imports ...
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Zap, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const premiumOffers = [
    {
        id: 1,
        title: "Smart food choices powered by AI",
        subtitle: "Premium Quality",
        description: "Experience five-star dining delivered fresh to your doorstep. Handmade burgers, artisan pizzas, and more.",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1600&auto=format&fit=crop",
        accent: "from-orange-500 to-red-600",
        code: "TASTY50",
        icon: Award
    },
    {
        id: 2,
        title: "Fastest Delivery in the Galaxy",
        subtitle: "30 Mins Promise",
        description: "Hungry? We deliver faster than you can set the table. AI-optimized live tracking included.",
        image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=1600&auto=format&fit=crop",
        accent: "from-blue-500 to-indigo-600",
        code: "SPEEDY30",
        icon: Zap
    },
    {
        id: 3,
        title: "Explore Global Flavors Daily",
        subtitle: "World Cuisine",
        description: "From Italian Pasta to spicy Indian Curry, explore a world of flavors today with AI insights.",
        image: "https://images.unsplash.com/photo-1543353071-087092ec393a?q=80&w=1600&auto=format&fit=crop",
        accent: "from-emerald-500 to-green-600",
        code: "WORLD40",
        icon: Sparkles
    }
];

// Framer Motion Variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
};

const textRevealVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
};

const imageVariants = {
    hidden: { opacity: 0, scale: 1.1 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.5 } }
};

const swipePower = (offset, velocity) => Math.abs(offset) * velocity;
const SWIPE_CONFIDENCE_THRESHOLD = 10000;

const HeroBanner = ({ topRightContent }) => {
    const [[page, direction], setPage] = useState([0, 0]);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const currentIndex = Math.abs(page % premiumOffers.length);
    const currentOffer = premiumOffers[currentIndex];
    const IconComponent = currentOffer.icon;

    const paginate = (newDirection) => {
        setIsAutoPlaying(false);
        setPage([page + newDirection, newDirection]);
    };

    useEffect(() => {
        if (!isAutoPlaying) return;
        const timer = setInterval(() => setPage([page + 1, 1]), 8000);
        return () => clearInterval(timer);
    }, [isAutoPlaying, page]);

    return (
        <div className="relative w-full mx-auto h-[65vh] min-h-[450px] md:h-[75vh] md:min-h-[600px] overflow-hidden bg-gray-950 rounded-[2.5rem] shadow-2xl group select-none">
            
            {/* Background Layer: Animated Gradient Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] animate-blob" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] animate-blob" style={{ animationDelay: '2s' }} />
            </div>

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <div className="relative h-full w-full overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={page}
                        custom={direction}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                    >
                        {/* Hero Image */}
                        <motion.img
                            variants={imageVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            src={currentOffer.image}
                            alt={currentOffer.title}
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none brightness-[0.7]"
                        />

                        {/* Premium Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                        {/* Content Area */}
                        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 lg:px-24 max-w-7xl mx-auto text-white z-20">
                            <motion.div 
                                variants={containerVariants} 
                                initial="hidden" 
                                animate="show" 
                                className="max-w-4xl"
                            >
                                <motion.div variants={textRevealVariants} className="flex items-center gap-3 mb-6">
                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${currentOffer.accent} shadow-xl`}>
                                        <IconComponent size={14} />
                                        {currentOffer.subtitle}
                                    </span>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-cyan-400 text-[10px] font-black tracking-widest uppercase">
                                        <Sparkles size={12} fill="currentColor" /> AI POWERED
                                    </div>
                                </motion.div>

                                <motion.h2 variants={textRevealVariants} className="text-5xl md:text-8xl font-black mb-6 leading-[0.95] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl">
                                    {currentOffer.title}
                                </motion.h2>

                                <motion.p variants={textRevealVariants} className="text-lg md:text-2xl font-medium mb-10 text-gray-300 max-w-2xl leading-relaxed opacity-90">
                                    {currentOffer.description}
                                </motion.p>

                                <motion.div variants={textRevealVariants} className="flex flex-wrap items-center gap-6">
                                    <button className="group relative px-10 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-orange-50 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,165,0,0.3)] hover:scale-105 active:scale-95 flex items-center gap-3">
                                        View Menu
                                        <ArrowRight size={20} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <div className="flex items-center gap-3 px-6 py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Code</span>
                                        <span className="text-lg font-black text-orange-400 tracking-wider font-mono">{currentOffer.code}</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Indicators */}
            <div className="absolute bottom-10 left-6 md:left-16 lg:left-24 right-6 md:right-16 lg:right-24 flex items-end justify-between z-30 pointer-events-none">
                <div className="flex gap-3 pointer-events-auto">
                    {premiumOffers.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setIsAutoPlaying(false); setPage([i, i > currentIndex ? 1 : -1]); }}
                            className={`h-2 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-20 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-3 bg-white/20 hover:bg-white/40'}`}
                        />
                    ))}
                </div>

                <div className="hidden md:flex gap-4 pointer-events-auto">
                    <button onClick={() => paginate(-1)} className="w-16 h-16 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 hover:scale-110 active:scale-90 shadow-2xl">
                        <ChevronLeft size={28} />
                    </button>
                    <button onClick={() => paginate(1)} className="w-16 h-16 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 hover:scale-110 active:scale-90 shadow-2xl">
                        <ChevronRight size={28} />
                    </button>
                </div>
            </div>

            {/* Embedded Location Widget Slot */}
            {topRightContent && (
                <div className="absolute top-6 right-6 md:right-16 lg:right-24 z-40">
                    {topRightContent}
                </div>
            )}
        </div>
    );
};

export default HeroBanner;
