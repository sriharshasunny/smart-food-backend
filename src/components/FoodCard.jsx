import React, { memo } from 'react';
import { Star, Plus, Heart, Clock, Flame } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { optimizeImage } from '../utils/imageOptimizer';

// Optimization: Use memo to prevent unnecessary re-renders
const FoodCard = memo(({ food, restaurantName, variant = 'vertical', isFeatured = false, onAdd }) => {
    const { addToCart, toggleWishlist, isInWishlist, cart } = useShop();
    const isWishlisted = isInWishlist(food.id);

    // Check if item is in cart
    const cartItem = cart.find(item => item.id === food.id);
    const quantity = cartItem?.quantity || 0;

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

    // Variant Check: Horizontal layout for restaurant menu page
    if (variant === 'horizontal') {
        return (
            <div
                className="bg-white rounded-3xl p-4 md:p-6 flex justify-between gap-6 relative group hover:bg-orange-50/30 transition-colors will-change-transform transform-gpu border border-transparent hover:border-orange-100"
            >
                {/* 1. Content Section (Left Side) */}
                <div className="flex-1 flex flex-col min-w-0 pr-2">
                    {/* Veg/Non-veg Indicator & Title */}
                    <div className="flex flex-col gap-1 mb-1">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center bg-white ${food.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`w-2 h-2 rounded-full ${food.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mt-1">
                            {food.name}
                        </h3>
                    </div>

                    {/* Price */}
                    <div className="font-bold text-gray-900 mb-2 mt-0.5 relative flex items-center gap-2">
                        <span>₹{food.price}</span>
                        {food.price > 300 && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Premium</span>}
                    </div>

                    {/* Rating if available */}
                    {food.rating && (
                        <div className="flex items-center gap-1 mb-3">
                            <Star className="w-3.5 h-3.5 fill-green-700 text-green-700" />
                            <span className="text-green-700 font-bold text-xs">{food.rating}</span>
                        </div>
                    )}

                    <p className="text-gray-500 text-sm line-clamp-2 md:line-clamp-3 leading-relaxed w-full max-w-sm mt-1">
                        {food.description}
                    </p>
                </div>

                {/* 2. Image Section (Right Side) */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 mt-2">
                    <div className="w-full h-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                        <img
                            src={optimizeImage(food.image, 300)}
                            alt={food.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transform"
                        />
                    </div>

                    {/* Wishlist Button - Top Right of Image */}
                    <button
                        onClick={handleWishlist}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                    >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    {/* Add Button - Overlapping Bottom Edge */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%]">
                        <button
                            onClick={handleAdd}
                            className="w-full bg-white text-green-600 hover:text-white hover:bg-green-600 font-black py-2.5 px-0 rounded-xl text-sm md:text-base tracking-wide flex justify-center items-center gap-1 transition-all shadow-md hover:shadow-lg border border-gray-200 hover:border-green-600"
                        >
                            ADD
                            <span className="text-lg font-light leading-none mb-0.5">+</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Vertical layout (original - for home page grid)
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300 group flex flex-col h-full will-change-transform transform transform-gpu hover:-translate-y-1">

            {/* Image Section - Fixed Height for Layout Stability */}
            <div className="relative h-40 bg-gray-100 overflow-hidden">
                <img
                    src={optimizeImage(food.image, 600)} // Optimize for card width (high dpi)
                    alt={food.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Restaurant Name Overlay */}
                {restaurantName && (
                    <div className="absolute top-3 left-3">
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 drop-shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            {restaurantName}
                        </p>
                    </div>
                )}

                {/* Rating Badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] font-bold border border-white/10">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span>{food.rating || 4.2}</span>
                </div>

                <button
                    onClick={handleWishlist}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-red-500 transition-colors"
                >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 line-clamp-1 text-sm group-hover:text-orange-600 transition-colors">
                        {food.name}
                    </h3>
                    <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 mt-1 ${food.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${food.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                </div>

                <p className="text-gray-500 text-[11px] line-clamp-2 mb-3 leading-relaxed">
                    {food.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="font-black text-gray-900">₹{food.price}</span>

                    <button
                        onClick={handleAdd}
                        className="bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wide transition-colors border border-gray-100 hover:border-orange-100"
                    >
                        ADD +
                    </button>
                </div>
            </div>
        </div>
    );
});

export default FoodCard;
