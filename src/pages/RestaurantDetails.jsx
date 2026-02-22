import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { API_URL } from '../config';

// import { mockRestaurants as restaurants, mockDishes as foodItems } from '../data/mockData'; // REMOVED MOCK
import FoodCard from '../components/FoodCard';
import { Star, Clock, MapPin, ChevronLeft, Search, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RestaurantDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [vegOnly, setVegOnly] = useState(false);
    const { toggleWishlist, isInWishlist } = useShop();


    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                // Parallel Fetch: Restaurant Details + Menu
                const [restRes, menuRes] = await Promise.all([
                    fetch(`${API_URL}/api/restaurant/${id}`),
                    fetch(`${API_URL}/api/food/restaurant/${id}`)
                ]);

                if (!restRes.ok) {
                    if (restRes.status === 404) throw new Error("Restaurant not found");
                    throw new Error("Failed to load restaurant");
                }

                const restData = await restRes.json();
                const menuData = await menuRes.json();

                // Ensure defaults
                setRestaurant({
                    ...restData,
                    image: restData.image || '/placeholder-restaurant.jpg',
                    cuisine: Array.isArray(restData.cuisine) ? restData.cuisine.join(', ') : (restData.cuisine || 'Multi-Cuisine'),
                    rating: restData.rating || 0,
                    deliveryTime: restData.deliveryTime || '30-40 mins', // Backend doesn't have this yet, maybe add col later
                    costForTwo: restData.costForTwo || '₹400',
                    address: restData.address || 'Location not available'
                });

                // Format menu if needed (backend matches frontend mostly)
                setMenu(menuData.map(item => ({
                    ...item,
                    isVeg: item.is_veg, // Map snake_case to camelCase
                    rating: 4.2 // Default rating for items if missing
                })));

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id]);

    // Grouping & Filtering Logic
    const filteredMenu = useMemo(() => {
        let items = menu;
        if (vegOnly) {
            items = items.filter(item => item.isVeg);
        }
        return items;
    }, [menu, vegOnly]);

    const groupedMenu = useMemo(() => {
        return filteredMenu.reduce((acc, item) => {
            const cat = item.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});
    }, [filteredMenu]);

    const displayItems = useMemo(() => {
        let items = filteredMenu;
        if (activeCategory !== 'All') {
            items = items.filter(item => item.category === activeCategory);
        }
        // ONLY SHOW AVAILABLE ITEMS TO CUSTOMERS
        items = items.filter(item => item.available !== false);

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            items = items.filter(item =>
                (item.name || '').toLowerCase().includes(lowerQuery) ||
                (item.category || '').toLowerCase().includes(lowerQuery)
            );
        }
        return items;
    }, [filteredMenu, activeCategory, searchQuery]);

    const displayGroups = useMemo(() => {
        return displayItems.reduce((acc, item) => {
            const cat = item.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});
    }, [displayItems]);

    // --- Loading / Error States ---
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold animate-pulse">Loading Menu...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="text-red-500 w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Oops!</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/home')}
                    className="bg-black text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-transform"
                >
                    Go Home
                </button>
            </div>
        </div>
    );

    if (!restaurant) return null; // Should be handled by loading/error

    const categories = ['All', ...Object.keys(groupedMenu)];

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans selection:bg-orange-100 selection:text-orange-900">
            {/* 1. Clean Professional Header (Swiggy/Zomato Style) */}
            <div className="bg-white px-4 md:px-8 pt-8 pb-6 border-b border-gray-100 shadow-sm sticky top-0 z-40">
                <div className="max-w-[1200px] mx-auto">
                    {/* Back & Breadcrumbs */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        {/* Title & Basics */}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-2">
                                {restaurant.name}
                            </h1>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                {restaurant.cuisine}
                            </p>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                {restaurant.address}
                                <span className="text-xs text-orange-500 font-bold ml-2">Open Now</span>
                            </p>
                        </div>

                        {/* Interactive Stats Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 w-full md:w-auto min-w-[300px]">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-1.5 text-green-700 font-black text-lg">
                                    <div className="bg-green-700 text-white p-1 rounded-full"><Star className="w-3.5 h-3.5 fill-current" /></div>
                                    {restaurant.rating || "4.2"}
                                </div>
                                <div className="w-px h-6 bg-gray-200"></div>
                                <div className="text-xs font-bold text-gray-500 text-right">
                                    <span className="block text-gray-900 text-sm">₹{restaurant.costForTwo?.replace('₹', '') || "400"}</span>
                                    Cost for Two
                                </div>
                            </div>
                            <div className="w-full h-px bg-gray-200 mb-3"></div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <Clock className="w-4 h-4 text-orange-500" />
                                Delivery in {restaurant.deliveryTime || "30-40 mins"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Detailed Menu Section */}
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Categories Sidebar - Sticky text links */}
                    <div className="hidden lg:block lg:col-span-3 sticky top-48">
                        <h3 className="font-black text-gray-900 text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                            Menu <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 animate-pulse"></span>
                        </h3>
                        <div className="space-y-1 relative">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex justify-between items-center group relative overflow-hidden"
                                >
                                    {/* Liquid Background Animation */}
                                    {activeCategory === category && (
                                        <motion.div
                                            layoutId="activeCategory"
                                            className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-md shadow-orange-500/25"
                                            transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                        />
                                    )}
                                    <span className={`relative z-10 transition-colors ${activeCategory === category ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                                        }`}>{category}</span>
                                    <span className={`relative z-10 text-[10px] font-black px-2 py-0.5 rounded-md transition-colors ${activeCategory === category ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                        }`}>
                                        {groupedMenu[category]?.length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="col-span-12 lg:col-span-9">
                        {/* Search & Filter Bar */}
                        <div className="bg-white/80 backdrop-blur-md pb-4 pt-2 flex flex-col md:flex-row items-center justify-between mb-2 sticky top-[180px] z-30">
                            <div className="flex-1 flex items-center px-4 gap-3">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search in menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-900 placeholder:text-gray-400 h-10"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="w-px h-8 bg-gray-200 mx-2"></div>
                            <button
                                onClick={() => setVegOnly(!vegOnly)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${vegOnly
                                    ? 'bg-green-500 text-white shadow-md shadow-green-500/25'
                                    : 'hover:bg-gray-50 text-gray-500'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-white' : 'bg-green-500'}`}></span>
                                Veg
                            </button>
                        </div>

                        {/* Items Grid */}
                        <div className="space-y-10">
                            {Object.keys(displayGroups).length > 0 ? (
                                Object.keys(displayGroups).map((category) => (
                                    <motion.div
                                        key={category}
                                        id={category}
                                        className="scroll-mt-32 content-visibility-auto contain-layout"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex items-center gap-3 mb-6 mt-10">
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{category}</h3>
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            {displayGroups[category].map((item, index) => {
                                                // Simplified Grid: Uniform sizing for all cards
                                                return (
                                                    <div key={item.id} className="w-full">
                                                        <FoodCard food={item} isFeatured={false} restaurantName={restaurant.name} variant="horizontal" />
                                                        <div className="w-full h-px bg-gray-100 mt-6"></div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">No dishes found</h3>
                                    <p className="text-gray-500">Try changing your filters or checking back later.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantDetails;
