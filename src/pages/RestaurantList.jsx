import React, { useState, useEffect, useMemo } from 'react';
import RestaurantCard from '../components/RestaurantCard';
import FoodCard from '../components/FoodCard';
import { Filter, Search, MapPin, ChevronRight, Zap } from 'lucide-react';
import { API_URL } from '../config';
import { useShop } from '../context/ShopContext';

const RestaurantList = () => {
    const { addToCart } = useShop();
    const [restaurants, setRestaurants] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('restaurants'); // 'restaurants' | 'recs'

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [restsRes, foodsRes] = await Promise.all([
                    fetch(`${API_URL}/api/restaurant/active/list`),
                    fetch(`${API_URL}/api/food/all`)
                ]);
                
                if (!restsRes.ok) throw new Error('Failed to fetch restaurants');
                const restsData = await restsRes.json();
                const foodsData = await foodsRes.json();
                
                setRestaurants(restsData);
                setDishes(foodsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("rating");
    const [vegOnly, setVegOnly] = useState(false);
    const [restaurantFilters, setRestaurantFilters] = useState({
        topRated: false,
        fastDelivery: false
    });

    const filteredData = useMemo(() => {
        let filteredRestaurants = [...restaurants];
        let filteredDishes = [...dishes];

        const q = searchQuery.toLowerCase();
        if (q) {
            filteredRestaurants = filteredRestaurants.filter(r => 
                (r.name || '').toLowerCase().includes(q) || 
                (Array.isArray(r.cuisine) ? r.cuisine.join(' ') : (r.cuisine || '')).toLowerCase().includes(q)
            );
            filteredDishes = filteredDishes.filter(d => 
                (d.name || '').toLowerCase().includes(q) || 
                (d.category || '').toLowerCase().includes(q)
            );
        }

        if (vegOnly) {
            filteredRestaurants = filteredRestaurants.filter(r => {
                const cuisineStr = Array.isArray(r.cuisine) ? r.cuisine.join(' ') : (r.cuisine || '');
                return cuisineStr.toLowerCase().includes('veg') || (r.tags && r.tags.includes('Vegetarian'));
            });
            filteredDishes = filteredDishes.filter(d => d.isVeg);
        }

        if (restaurantFilters.topRated) {
            filteredRestaurants = filteredRestaurants.filter(r => (r.rating || 0) >= 4.5);
        }
        if (restaurantFilters.fastDelivery) {
            filteredRestaurants = filteredRestaurants.filter(r => (parseInt(r.deliveryTime) || 99) <= 30);
        }

        if (sortBy === 'rating') {
            filteredRestaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return { restaurants: filteredRestaurants, dishes: filteredDishes };
    }, [restaurants, dishes, searchQuery, sortBy, vegOnly, restaurantFilters]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Syncing Kitchens...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 min-h-screen bg-gray-50">
            {/* Header Section from Image 1 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                <div className="flex flex-col gap-4">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-full w-fit">
                        <button
                            onClick={() => setViewMode('restaurants')}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all ${viewMode === 'restaurants' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            Restaurants
                        </button>
                        <button
                            onClick={() => setViewMode('recs')}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all ${viewMode === 'recs' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            AI Picks
                        </button>
                    </div>
                    
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                            Top Rated <span className="text-orange-500">Kitchens</span>
                        </h1>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.25em] mt-3">Live in your sector</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setRestaurantFilters(prev => ({ ...prev, fastDelivery: !prev.fastDelivery }))}
                        className={`px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${restaurantFilters.fastDelivery ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                        Fast Delivery
                    </button>
                    <button 
                        onClick={() => setRestaurantFilters(prev => ({ ...prev, topRated: !prev.topRated }))}
                        className={`px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${restaurantFilters.topRated ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                        Top Rated
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            {viewMode === 'restaurants' ? (
                filteredData.restaurants.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                         <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tighter">No kitchens found</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Adjust your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
                        {filteredData.restaurants.map((restaurant) => (
                            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                        ))}
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-32">
                    {filteredData.dishes.map((dish) => (
                        <FoodCard key={dish.id} food={dish} onAdd={addToCart} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default RestaurantList;
