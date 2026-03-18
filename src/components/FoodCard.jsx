import React, { memo, useState } from 'react';
import { Star, Plus, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../context/ShopContext';
import { optimizeImage } from '../utils/imageOptimizer';

const FoodCard = memo(({ food, restaurantName, variant = 'vertical', onAdd }) => {
    const { addToCart, toggleWishlist, isInWishlist } = useShop();
    const [imageLoaded, setImageLoaded] = useState(false);
    const isWishlisted = isInWishlist(food.id);

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onAdd) onAdd(food); else addToCart(food);
    };

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(food);
    };

    if (variant === 'horizontal') {
        return (
            <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-[2rem] p-4 border border-gray-100 flex gap-5 relative hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-xl gpu-accelerated"
            >
                <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-50">
                    <img
                        src={optimizeImage(food.image, 300)}
                        alt={food.name}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                    />
                    <div className={`absolute top-2 left-2 w-4 h-4 rounded-sm border flex items-center justify-center bg-white shadow-sm ${food.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${food.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-1">{food.name}</h3>
                            <button onClick={handleWishlist} className="text-gray-300 hover:text-red-500 transition-colors">
                                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>
                        </div>
                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed font-medium">{food.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-yellow-500 font-black text-xs mb-1">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{food.rating || 4.2}</span>
                            </div>
                            <span className="font-black text-xl text-gray-900 tracking-tight">₹{food.price}</span>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAdd}
                            className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
                        >
                            Add +
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer relative hover:border-orange-100 transition-all duration-500 shadow-sm hover:shadow-2xl group gpu-accelerated"
        >
            <div className="relative h-56 bg-gray-50 overflow-hidden">
                <img
                    src={optimizeImage(food.image, 600)}
                    alt={food.name}
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 ${imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-lg'}`}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {restaurantName && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="text-[9px] font-black text-white uppercase tracking-[0.15em] bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            {restaurantName}
                        </span>
                    </div>
                )}

                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-yellow-400 text-[11px] font-black border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {food.rating || 4.2}
                </div>

                <button
                    onClick={handleWishlist}
                    className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white/70 hover:text-red-500 hover:bg-white transition-all shadow-sm border border-white/10"
                >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
            </div>

            <div className="p-6 flex flex-col flex-grow bg-white relative z-10">
                <div className="flex justify-between items-start mb-2 gap-3">
                    <h3 className="font-black text-gray-900 line-clamp-1 text-[17px] leading-tight group-hover:text-orange-600 transition-colors">
                        {food.name}
                    </h3>
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm bg-white ${food.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${food.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                </div>

                <p className="text-gray-500 text-xs font-medium line-clamp-2 mb-6 leading-relaxed opacity-80">
                    {food.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Price</span>
                        <span className="font-black text-xl text-gray-900 leading-none tracking-tight">₹{food.price}</span>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleAdd}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-3 px-7 rounded-2xl text-[11px] uppercase tracking-[0.1em] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        Add <Plus size={14} strokeWidth={3} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
});

export default memo(FoodCard, (prevProps, nextProps) => {
    return prevProps.food.id === nextProps.food.id &&
        prevProps.variant === nextProps.variant &&
        prevProps.onAdd === nextProps.onAdd;
});
