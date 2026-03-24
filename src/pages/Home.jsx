import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import FilterBar from '../components/FilterBar';
import FoodCard from '../components/FoodCard';
import RestaurantCard from '../components/RestaurantCard';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { mockRestaurants, mockDishes, categories } from '../data/mockData';
import { Search, MapPin, ChevronRight, Sparkles, Flame, Zap, ChevronDown } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import SkeletonCard from '../components/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';

import { API_URL } from '../config';  // Import Config

const Home = () => {
    const { addToCart, searchQuery, setSearchQuery } = useShop();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Recommendation state for Trending Picks panel
    const [trendingRecs, setTrendingRecs] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [trendingVisible, setTrendingVisible] = useState(4); // How many to show
    const TRENDING_STEP = 4;

    // Fetch recommendations for logged-in users (same as AI Picks)
    React.useEffect(() => {
        const userId = user?._id || user?.id;
        if (!userId) return;
        setLoadingRecs(true);
        fetch(`${API_URL}/api/recommendations/${userId}?limit=20`)
            .then(r => r.json())
            .then(data => setTrendingRecs(data.recommendations || []))
            .catch(() => {})
            .finally(() => setLoadingRecs(false));
    }, [user]);

    // Data State
    const [dishes, setDishes] = useState([]);
    const [realRestaurants, setRealRestaurants] = useState([]); // Store real restaurants
    const [loadingData, setLoadingData] = useState(true);

    // Fetch Real Data (Foods AND Restaurants)
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel Fetch
                const [foodsRes, restsRes] = await Promise.all([
                    fetch(`${API_URL}/api/food/all`),
                    fetch(`${API_URL}/api/restaurant/active/list`) // Fetch ONLY active restaurants
                ]);

                const foodsData = await foodsRes.json();
                const restsData = await restsRes.json();

                if (Array.isArray(foodsData)) setDishes(foodsData);
                if (Array.isArray(restsData)) setRealRestaurants(restsData);

            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // const [searchQuery, setSearchQuery] = useState(''); // REMOVED local state
    const [activeCategory, setActiveCategory] = useState('All');
    const [subFilters, setSubFilters] = useState({
        rating45Plus: false,
        rating4Plus: false,
        rating35Plus: false,
        vegOnly: false,
        maxPrice: 1000
    });
    const [restaurantFilters, setRestaurantFilters] = useState({
        topRated: false,
        veg: false,
        fastDelivery: false
    });
    const [viewMode, setViewMode] = useState('restaurants'); // 'restaurants' | 'recs'
    const [isSticky, setIsSticky] = useState(false);
    const filterRef = React.useRef(null);
    const observerTargetRef = React.useRef(null); // Invisible target for IntersectionObserver
    const sectionHeaderRef = React.useRef(null); // Track the "Explore Food Items" text

    // --- Geolocation State ---
    const [locationName, setLocationName] = useState("Detecting...");
    const [loadingLocation, setLoadingLocation] = useState(false);

    // --- Geolocation Logic ---
    const detectLocation = () => {
        if (!navigator.geolocation) {
            setLocationName("Not Supported");
            return;
        }

        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse Geocoding (using a free API or mock)
                    // For demo, we'll use a mock response based on coords or just "Current Location"
                    // In real app -> fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)

                    // Simulating API delay
                    await new Promise(r => setTimeout(r, 1000));
                    setLocationName("Indiranagar, BLR"); // Mock result
                } catch (error) {
                    setLocationName("Unknown Location");
                } finally {
                    setLoadingLocation(false);
                }
            },
            () => {
                setLocationName("Permission Denied");
                setLoadingLocation(false);
            }
        );
    };

    // Auto-detect on mount
    React.useEffect(() => {
        detectLocation();
    }, []);

    // --- Sticky Scroll Logic ---
    const [showStickyFilters, setShowStickyFilters] = useState(false);

    React.useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-75px 0px 0px 0px', // Trigger exactly when the element goes under the ~70px navbar
            threshold: 0
        };

        const observerCallback = (entries) => {
            const [entry] = entries;
            // Show sticky filter ONLY if it's not intersecting AND it scrolled UP out of view (top < 75)
            // This prevents it from showing when it's off-screen at the bottom of the page initially
            const isScrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 75;
            setShowStickyFilters(isScrolledPast);
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const currentTarget = filterRef.current; // Observe the actual filter bar container

        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) observer.unobserve(currentTarget);
            observer.disconnect();
        };
    }, []);

    // --- Auto-Scroll on Search ---
    React.useEffect(() => {
        if (searchQuery && filterRef.current) {
            // Scroll a bit above the filters
            const offset = 100;
            const elementPosition = filterRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            // Also switch to 'recs' view if searching? No, filter logic handles both.
        }
    }, [searchQuery]);


    // --- Filtering Logic ---
    const filteredData = useMemo(() => {
        let filteredDishes = dishes;
        let filteredRestaurants = realRestaurants; // Use Real Restaurants

        // 1. Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredDishes = filteredDishes.filter(d => (d.name?.toLowerCase() || '').includes(query) || (d.category?.toLowerCase() || '').includes(query));
            filteredRestaurants = filteredRestaurants.filter(r => {
                const nameMatch = (r.name?.toLowerCase() || '').includes(query);
                const cuisineStr = Array.isArray(r.cuisine) ? r.cuisine.join(' ') : (r.cuisine || '');
                const cuisineMatch = cuisineStr.toLowerCase().includes(query);
                return nameMatch || cuisineMatch;
            });
        }

        // 2. Category Filter (Biryani, Sushi, etc) - ONLY FOR DISHES
        if (activeCategory !== 'All') {
            filteredDishes = filteredDishes.filter(d => d.category === activeCategory || (d.name && d.name.includes(activeCategory)));
        }

        // 3. Sub Filters (applies to FOOD/DISHES)
        if (subFilters.rating45Plus) {
            filteredDishes = filteredDishes.filter(d => (d.rating || 0) >= 4.5);
        }
        if (subFilters.rating4Plus) {
            filteredDishes = filteredDishes.filter(d => (d.rating || 0) >= 4.0);
        }
        if (subFilters.rating35Plus) {
            filteredDishes = filteredDishes.filter(d => (d.rating || 0) >= 3.5);
        }
        if (subFilters.vegOnly) {
            filteredDishes = filteredDishes.filter(d => d.isVeg);
        }
        if (subFilters.maxPrice < 1000) {
            filteredDishes = filteredDishes.filter(d => d.price <= subFilters.maxPrice);
        }
        // Restaurant Filters (Separate Logic)
        if (restaurantFilters.topRated) {
            filteredRestaurants = filteredRestaurants.filter(r => (r.rating || 0) >= 4.5);
        }
        if (restaurantFilters.veg) {
            // Check cuisine or tags if available
            filteredRestaurants = filteredRestaurants.filter(r => {
                const cuisineStr = Array.isArray(r.cuisine) ? r.cuisine.join(' ') : (r.cuisine || '');
                return cuisineStr.toLowerCase().includes('veg') ||
                    (r.tags && (r.tags.includes('Vegetarian') || r.tags.includes('Pure Veg')));
            });
        }
        if (restaurantFilters.fastDelivery) {
            // Prioritize reliable check
            filteredRestaurants = filteredRestaurants.filter(r => (parseInt(r.deliveryTime) || 99) <= 30);
        }

        return { dishes: filteredDishes, restaurants: filteredRestaurants };
    }, [searchQuery, activeCategory, subFilters, restaurantFilters, dishes, realRestaurants]);

    // High-End Glassmorphism Location Widget
    const locationWidget = (
        <div
            className="flex items-center gap-3 bg-white/10 backdrop-blur-2xl p-2 pl-3 pr-5 rounded-full border border-white/20 shadow-2xl transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-orange-500/20 cursor-pointer group relative overflow-hidden"
            onClick={detectLocation}
        >
            {/* Glossy highlight line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

            <button
                className="bg-gradient-to-br from-orange-400 to-red-500 p-2.5 rounded-full shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300 relative"
                title="Detect My Location"
            >
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <MapPin size={16} className={`text-white w-4 h-4 ${loadingLocation ? 'animate-bounce' : ''}`} />
            </button>
            <div className="flex flex-col items-start pt-0.5">
                <h2 className="text-[10px] font-black text-orange-200 uppercase tracking-[0.2em] leading-none mb-1">Delivering to</h2>
                <h1 className="text-[15px] font-black text-white leading-none drop-shadow-md group-hover:text-orange-300 transition-colors max-w-[160px] truncate">
                    {loadingLocation ? "Locating..." : locationName}
                </h1>
            </div>
        </div>
    );

    // Memoized add handler to prevent prop thrashing on FoodCard
    const handleAddToCart = React.useCallback((food) => {
        addToCart(food);
    }, [addToCart]);

    // --- Scroll Logic ---
    const restaurantContainerRef = React.useRef(null);
    const trendingContainerRef = React.useRef(null);

    const scrollContainer = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = direction === 'horizontal' ? 300 : 200; // Adjust scroll distance
            if (direction === 'left') ref.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            if (direction === 'right') ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            if (direction === 'up') ref.current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
            if (direction === 'down') ref.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-900">
            {/* Main Content Area - with Padding */}
            <div className="w-full px-1 sm:px-2 pt-0 space-y-3.5 mx-auto">

                {/* Hero Banner (Offers) WITH Location Widget Embedded */}
                <ErrorBoundary key="hero">
                    <HeroBanner topRightContent={locationWidget} />
                </ErrorBoundary>

                {/* --- Content Sections --- */}

                {/* --- RESTAURANT DISCOVERY SECTION (RESTORED OLD STYLE) --- */}
                <div className="bg-[#fffcf7] rounded-[2.5rem] p-6 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-orange-50/50 relative overflow-hidden">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                        {/* Tab Switcher */}
                        <div className="flex items-center bg-gray-100/80 p-1 rounded-full relative w-fit backdrop-blur-sm self-center md:self-start">
                            <button
                                onClick={() => setViewMode('restaurants')}
                                className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all z-10 ${viewMode === 'restaurants' ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Restaurants
                            </button>
                            <button
                                onClick={() => setViewMode('recs')}
                                className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all z-10 ${viewMode === 'recs' ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                AI Picks
                            </button>
                            {/* Sliding Background */}
                            <motion.div 
                                layoutId="home-tab-bg"
                                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-black rounded-full z-0"
                                initial={false}
                                animate={{ x: viewMode === 'restaurants' ? 0 : '100%' }}
                                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center gap-3 self-center md:self-end">
                            <button 
                                onClick={() => setRestaurantFilters(prev => ({ ...prev, fastDelivery: !prev.fastDelivery }))}
                                className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${restaurantFilters.fastDelivery ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
                            >
                                Fast Delivery
                            </button>
                            <button 
                                onClick={() => setRestaurantFilters(prev => ({ ...prev, topRated: !prev.topRated }))}
                                className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${restaurantFilters.topRated ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
                            >
                                Top Rated
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="relative z-10 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={viewMode}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            >
                                {loadingData ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <div key={`skel-${i}`} className="h-full">
                                            <SkeletonCard />
                                        </div>
                                    ))
                                ) : viewMode === 'restaurants' ? (
                                    filteredData.restaurants.length > 0 ? (
                                        filteredData.restaurants.map((restaurant) => (
                                            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                                <Zap size={30} />
                                            </div>
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No matching restaurants found</p>
                                        </div>
                                    )
                                ) : (
                                    filteredData.dishes.length > 0 ? (
                                        filteredData.dishes.slice(0, 12).map((dish) => (
                                            <FoodCard key={dish.id} food={dish} onAdd={handleAddToCart} />
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                                <Sparkles size={30} />
                                            </div>
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No AI picks available yet</p>
                                        </div>
                                    )
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>


                {/* --- MENU PARTITION --- */}

                {/* 1. Premium Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                {/* 2. Menu Section Header (Glowing Gradient Line) */}
                <div ref={sectionHeaderRef} className="flex items-center justify-center relative py-6 md:py-8 overflow-hidden group">
                    <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent flex-1 opacity-50"></div>

                    <div className="px-6 relative">
                        <span className="relative px-6 py-2 bg-white rounded-full border border-orange-100 text-sm md:text-base font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 uppercase shadow-sm">
                            Explore Food Items
                        </span>
                    </div>

                    <div className="h-px bg-gradient-to-r from-orange-300 via-pink-300 to-transparent flex-1 opacity-50"></div>
                </div>

                {/* 3. Filter Stack (MAIN + STICKY) */}
                <div className="relative">
                    {/* A. Main Filters (Visual Glossy Mode) - Scrolls away */}
                    <div ref={filterRef} className="w-full z-10 relative">
                        <FilterBar
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            subFilters={subFilters}
                            setSubFilters={setSubFilters}
                            isSticky={false} // Always Glossy
                        />
                    </div>

                    {/* NEW: Secondary Search Bar Below FilterBar */}
                    <div className="mt-4 mb-2 relative w-full max-w-xl mx-auto px-2">
                        <div className="relative flex items-center bg-white rounded-full border shadow-sm focus-within:shadow-md transition-all border-gray-200 focus-within:border-orange-500">
                            <Search className="absolute left-4 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search dishes, restaurants..."
                                className="w-full pl-10 pr-12 py-2.5 rounded-full text-sm outline-none bg-transparent placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* B. Sticky Filter Bar (Text Mode) - Slides down when main is gone */}
                    <div className={`fixed top-[54px] md:top-[70px] left-0 w-full z-40 bg-white/95 backdrop-blur-md shadow-md transition-all duration-300 transform ${showStickyFilters ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
                        <FilterBar
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            subFilters={subFilters}
                            setSubFilters={setSubFilters}
                            isSticky={true} // Always Compact Text
                        />
                        {/* Optional: Add search bar to sticky header too? User said "under filters above to the food cards". Sticky is mostly filters. I'll leave it out for now to avoid clutter, or maybe add it if requested. */}
                    </div>
                </div>

                {/* 4. Popular Food Items Section (Bottom) */}
                <section className="min-h-[500px] content-visibility-auto contain-layout pt-2">
                    {/* Food Grid */}
                    <ErrorBoundary key="food-grid">
                        {loadingData ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 gap-y-10">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={`skel-g-${i}`} className="h-[320px]">
                                        <SkeletonCard />
                                    </div>
                                ))}
                            </div>
                        ) : realRestaurants.length === 0 ? (
                            <div className="w-full text-center py-20 flex flex-col items-center justify-center p-4">
                                <div className="bg-red-50 p-6 rounded-full mb-6 relative">
                                    <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
                                    <span className="text-4xl">🔌</span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 mb-2">Connection Issue</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
                                    We couldn't load the restaurants at the moment. The backend might be waking up or updating.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        ) : filteredData.dishes.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 gap-y-10">
                                {filteredData.dishes.map((dish) => (
                                    <FoodCard
                                        key={dish.id}
                                        food={dish}
                                        restaurantName={dish.restaurantName}
                                        onAdd={handleAddToCart}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                                <div className="bg-gray-50 p-6 rounded-full mb-4">
                                    <Search size={48} className="text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-700">No items found</h3>
                                <p className="text-gray-500 mt-2">Try changing your filters or search term.</p>
                            </div>
                        )}
                    </ErrorBoundary>
                </section>

            </div>
        </div>
    );
};

export default Home;
