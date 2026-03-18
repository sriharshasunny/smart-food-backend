import React from 'react';
import CategoryFilter from './CategoryFilter';
import { categories } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Leaf, ChevronRight, X, Zap } from 'lucide-react';

const FilterBar = ({ activeCategory, setActiveCategory, subFilters, setSubFilters, isSticky }) => {
    const [showPriceSlider, setShowPriceSlider] = React.useState(false);

    const toggleSubFilter = (filterKey) => {
        setSubFilters(prev => ({ ...prev, [filterKey]: !prev[filterKey] }));
    };

    return (
        <div
            className={`transition-all duration-500 ease-spring z-20 
            ${isSticky
                    ? 'w-full h-[70px] flex items-center justify-between bg-white/90 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.05)] border-b border-gray-100 px-6'
                    : 'relative w-full bg-transparent px-0'
                }`}
        >
            <div className="w-full h-full flex items-center justify-between gap-6">

                {/* 1. Categories */}
                <div className="flex-1 min-w-0 overflow-hidden h-full flex items-center">
                    <CategoryFilter
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelectCategory={setActiveCategory}
                        isSticky={isSticky}
                    />
                </div>

                {/* 2. Secondary Filters */}
                <div className={`flex-shrink-0 flex items-center gap-3 ${isSticky ? '' : 'ml-4 border-l border-gray-100 pl-6 py-2'}`}>

                    {/* Top Rated */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSubFilter('rating45Plus')}
                        className={`transition-all duration-300 flex items-center gap-2 border px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-wider
                            ${subFilters.rating45Plus
                                ? 'bg-gray-900 text-white border-transparent shadow-xl shadow-gray-900/20'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <Star size={14} className={subFilters.rating45Plus ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} />
                        <span>Top Rated</span>
                    </motion.button>

                    {/* Veg Only */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSubFilter('vegOnly')}
                        className={`transition-all duration-300 flex items-center gap-2 border px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-wider
                            ${subFilters.vegOnly
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-transparent shadow-xl shadow-green-500/20'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/30'
                            }`}
                    >
                        <Leaf size={14} />
                        <span>Pure Veg</span>
                    </motion.button>

                    {/* Budget Filter */}
                    <div className="relative">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPriceSlider(!showPriceSlider)}
                            className={`transition-all duration-300 flex items-center gap-2 border px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-wider
                                ${subFilters.maxPrice < 1000
                                    ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white border-transparent shadow-xl shadow-orange-500/20'
                                    : 'bg-white text-gray-500 border-gray-100 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50/30'
                                }`}
                        >
                            <span>{subFilters.maxPrice < 1000 ? `₹${subFilters.maxPrice}` : 'Budget'}</span>
                            {subFilters.maxPrice < 1000 ? (
                                <X size={14} className="hover:rotate-90 transition-transform" onClick={(e) => { e.stopPropagation(); setSubFilters(prev => ({ ...prev, maxPrice: 1000 })); }} />
                            ) : (
                                <ChevronRight size={14} className={`transition-transform duration-300 ${showPriceSlider ? 'rotate-90' : ''}`} />
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {showPriceSlider && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute right-0 top-full mt-4 bg-white/95 backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_20px_70px_rgba(0,0,0,0.15)] border border-gray-100 z-[100] w-72"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Max Price</span>
                                            <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{subFilters.maxPrice}</span>
                                        </div>
                                        <div className="bg-orange-500/10 p-2 rounded-xl text-orange-600">
                                            <Zap size={18} />
                                        </div>
                                    </div>

                                    <div className="relative h-2 flex items-center mb-6">
                                        <div className="absolute w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-300"
                                                style={{ width: `${(subFilters.maxPrice / 1000) * 100}%` }}
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max="1000"
                                            step="50"
                                            value={subFilters.maxPrice || 1000}
                                            onChange={(e) => setSubFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                                            className="w-full h-6 absolute z-20 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-orange-500 [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                                        />
                                    </div>

                                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        <span>₹100</span>
                                        <span>₹500</span>
                                        <span>₹1000+</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
