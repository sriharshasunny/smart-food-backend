import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { API_URL } from '../config';
import { trackAddToCart } from '../utils/trackActivity';
import { Rocket, Sparkles, Zap, ShieldCheck, ChevronRight, Info } from 'lucide-react';

// ─── CSS Visual Effects ──────────────────────────────────────────────────────
const SPACE_CSS = `
  @keyframes stars {
    from { transform: translateY(0); }
    to { transform: translateY(-50%); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(2deg); }
  }
  @keyframes scan {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 0.5; }
    100% { transform: translateY(1000%); opacity: 0; }
  }
  @keyframes ufo-hover {
    0% { transform: translate(0, 0) rotate(0); }
    25% { transform: translate(10px, -5px) rotate(1deg); }
    75% { transform: translate(-5px, 5px) rotate(-1deg); }
    100% { transform: translate(0, 0) rotate(0); }
  }
  .star-field {
    animation: stars 120s linear infinite;
    background-image: 
      radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)),
      radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)),
      radial-gradient(1.5px 1.5px at 90px 40px, #fff, rgba(0,0,0,0));
    background-size: 200px 200px;
    opacity: 0.3;
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .match-glow {
    box-shadow: 0 0 15px rgba(249, 115, 22, 0.4);
  }
`;

const StarField = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050510]">
    <div className="absolute inset-0 star-field" />
    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-orange-900/10" />
  </div>
);

const FloatingUFO = ({ top, left, delay = 0, size = 40 }) => (
  <div 
    className="absolute pointer-events-none opacity-40 select-none hidden md:block"
    style={{ 
      top: `${top}%`, 
      left: `${left}%`, 
      animation: `ufo-hover 8s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C8.68629 4 6 5.79086 6 8C6 8.52554 6.15552 9.02324 6.4344 9.46781C4.42173 10.1064 3 11.3916 3 12.875C3 15.1532 7.02944 17 12 17C16.9706 17 21 15.1532 21 12.875C21 11.3916 19.5783 10.1064 17.5656 9.46781C17.8445 9.02324 18 8.52554 18 8C18 5.79086 15.3137 4 12 4Z" fill="#ff6b00" fillOpacity="0.2" stroke="#ff8c00" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 8C8 6.89543 9.79086 6 12 6C14.2091 6 16 6.89543 16 8" stroke="#ff8c00" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="13" r="1.5" fill="#ffcc00" />
      <circle cx="12" cy="13" r="1.5" fill="#ffcc00" />
      <circle cx="16" cy="13" r="1.5" fill="#ffcc00" />
    </svg>
  </div>
);

// ─── Skeleton ───────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 animate-pulse">
    <div className="h-48 bg-white/10" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
      <div className="flex justify-between items-center mt-4">
        <div className="h-5 bg-white/10 rounded w-16" />
        <div className="h-8 bg-orange-500/20 rounded-xl w-20" />
      </div>
    </div>
  </div>
);

// ─── Food Grid Card ──────────────────────────────────────────────────────────
const FoodGridCard = ({ food, userId, onAdd }) => {
  const isVeg = food.is_veg === true || food.is_veg === 'true' || food.isVeg;
  const rating = parseFloat(food.rating) || 4.2;
  const score = food._score ? (food._score * 100).toFixed(0) : null;

  return (
    <div
      className="group relative glass-card rounded-2xl overflow-hidden
                 hover:border-orange-500/60 hover:shadow-2xl hover:shadow-orange-500/20
                 hover:-translate-y-2 transition-all duration-500 ease-out"
    >
      {/* Light Scan Effect on card entry/hover */}
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-bounce pointer-events-none" />

      {/* Image Section */}
      <div className="relative h-52 overflow-hidden bg-[#0a0a15]">
        {food.image ? (
          <img
            src={food.image}
            alt={food.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out brightness-90 group-hover:brightness-105"
            loading="lazy"
            onError={e => { e.target.onerror = null; e.target.src = ''; e.target.style.display='none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-900 shadow-inner italic">🍽️</div>
        )}

        {/* Dynamic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent opacity-80" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider backdrop-blur-md border ${isVeg ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-400' : 'bg-red-400'} shadow-[0_0_5px_currentColor]`} />
            {isVeg ? 'Veg' : 'Non-Veg'}
          </span>
        </div>

        {/* Match Percentage - Pulsing Badge */}
        {score && (
          <div className="absolute top-3 right-3 flex flex-col items-end">
            <div className="match-glow bg-gradient-to-br from-orange-400 to-red-600 text-white px-3 py-1 rounded-full font-black text-[11px] shadow-lg animate-pulse">
              {score}% MATCH
            </div>
          </div>
        )}

        {/* Price Tag - Floating */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
          <span className="text-white font-black text-lg">₹{food.price}</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5 border-t border-white/5 relative z-10">
        <h3 className="text-gray-100 font-black text-lg leading-tight group-hover:text-orange-400 transition-colors duration-300 truncate">
          {food.name}
        </h3>
        <p className="text-gray-400 text-xs font-medium flex items-center gap-1.5 mt-1.5 uppercase tracking-wide">
          <Sparkles size={10} className="text-orange-500" />
          {food.restaurant?.name || food.restaurantName || 'Galactic Kitchen'}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3 h-6">
          {food.cuisine && (
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 flex items-center gap-1">
              <Zap size={8} /> {food.cuisine}
            </span>
          )}
          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
            ⭐ {rating.toFixed(1)}
          </span>
        </div>

        {/* Add Button */}
        <button
          onClick={() => { trackAddToCart(userId, food); onAdd(food); }}
          className="mt-5 w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 active:scale-[0.98] text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-orange-500/40 border border-white/10"
        >
          Inject to Cart
        </button>
      </div>
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
      ${active
        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
        : 'bg-white/5 border-white/10 text-gray-400 hover:border-orange-500/40 hover:text-white'
      }`}
  >
    {label}
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const Recommendations = () => {
  const { user } = useAuth();
  const { addToCart } = useShop();

  const [foods, setFoods] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [strategy, setStrategy] = useState('');
  const [mealType, setMealType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [vegFilter, setVegFilter] = useState('all'); // 'all' | 'veg' | 'non_veg'
  const [mealFilter, setMealFilter] = useState('all'); // 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'

  const userId = user?._id || user?.id;
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (pageNum = 1, reset = false) => {
    if (!userId || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const url = `${API_URL}/api/recommendations/${userId}?limit=20&page=${pageNum}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      const newFoods = data.recommendations || [];
      setFoods(prev => reset ? newFoods : [...prev, ...newFoods]);
      setExplanation(data.explanation || '');
      setStrategy(data.strategy || '');
      setMealType(data.mealType || '');
      setHasMore(newFoods.length === 20);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, false);
  };

  // Apply client-side filters on the loaded set
  const filtered = foods.filter(f => {
    const isVeg = f.is_veg === true || f.is_veg === 'true';
    if (vegFilter === 'veg' && !isVeg) return false;
    if (vegFilter === 'non_veg' && isVeg) return false;
    if (mealFilter !== 'all' && f.meal_type && f.meal_type !== 'any' && f.meal_type !== mealFilter) return false;
    return true;
  });

  const strategyLabel = strategy === 'cold_start'
    ? '🔥 Trending Near You'
    : '✨ Personalised For You';

  const mealIcon = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿' };

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-white mb-2">Login to see recommendations</h2>
        <p className="text-gray-400 text-sm">Your personal food recommendations appear here after you log in.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] pb-24 relative overflow-hidden">
      <style>{SPACE_CSS}</style>
      
      {/* Visual Backdrop */}
      <StarField />
      <FloatingUFO top={15} left={10} delay={0} size={60} />
      <FloatingUFO top={25} right={5} delay={2} size={40} />
      <FloatingUFO bottom={10} left={20} delay={4} size={50} />

      {/* Scanning Light Effect (Global) */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute inset-x-0 h-1 bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.5)] opacity-0 animate-[scan_10s_linear_infinite]" />
      </div>

      <div className="relative z-20">
      {/* Page Header - Futuristic Aesthetic */}
      <div className="px-4 md:px-8 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-orange-500 font-black tracking-[0.2em] text-[10px] uppercase">
              <Zap size={14} className="fill-orange-500" /> AI Deep Scan Active
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                {strategyLabel.split(' ').slice(1).join(' ')}
              </h1>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white font-bold flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  LIVE ENGINE
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar - Integral Styling */}
          <div className="flex flex-wrap gap-2 pb-2">
            <FilterChip label="All Picks" active={vegFilter === 'all'} onClick={() => setVegFilter('all')} />
            <div className="w-px bg-white/10 mx-1 self-stretch" />
            <FilterChip label="Veg Only" active={vegFilter === 'veg'} onClick={() => setVegFilter('veg')} />
            <FilterChip label="Non-Veg" active={vegFilter === 'non_veg'} onClick={() => setVegFilter('non_veg')} />
          </div>
        </div>

        {/* AI Explainer - 'Mothership Message' Style Banner */}
        {explanation && (
          <div className="mt-10 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative glass-card border-orange-500/20 p-5 md:p-6 rounded-2xl flex items-start gap-4 overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                <Rocket size={80} />
              </div>
              <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/30 text-orange-400 shrink-0 shadow-lg shadow-orange-500/10">
                <Info size={24} />
              </div>
              <div>
                <p className="text-white font-black text-xs uppercase tracking-widest mb-1 text-orange-400/80">Hyper-Personalized Insight</p>
                <p className="text-gray-300 text-sm md:text-md italic leading-relaxed font-medium">
                  "{explanation}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Filters / Categories */}
      <div className="px-4 md:px-8 mb-10 scrolling-touch overflow-x-auto hide-scrollbar">
        <div className="flex gap-3 pb-2">
          <FilterChip label="🌅 Breakfast" active={mealFilter === 'breakfast'} onClick={() => setMealFilter(p => p === 'breakfast' ? 'all' : 'breakfast')} />
          <FilterChip label="☀️ Lunch"     active={mealFilter === 'lunch'}     onClick={() => setMealFilter(p => p === 'lunch' ? 'all' : 'lunch')} />
          <FilterChip label="🌙 Dinner"    active={mealFilter === 'dinner'}    onClick={() => setMealFilter(p => p === 'dinner' ? 'all' : 'dinner')} />
          <FilterChip label="🍿 Snack"     active={mealFilter === 'snack'}     onClick={() => setMealFilter(p => p === 'snack' ? 'all' : 'snack')} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 md:mx-8 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 text-sm">⚠️ {error} — Showing available data.</p>
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="px-4 md:px-8 text-gray-500 text-sm mb-4">
          Showing {filtered.length} recommendation{filtered.length !== 1 ? 's' : ''}
          {vegFilter !== 'all' || mealFilter !== 'all' ? ' (filtered)' : ''}
        </p>
      )}

      {/* Grid */}
      <div className="px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading && foods.length === 0
            ? Array(8).fill(0).map((_, i) => <Skeleton key={i} />)
            : filtered.map(food => (
                <FoodGridCard
                  key={food.id}
                  food={food}
                  userId={userId}
                  onAdd={f => { addToCart(f); trackAddToCart(userId, f); }}
                />
              ))
          }
        </div>

        {/* No results after filter */}
        {!loading && filtered.length === 0 && (
          <div className="py-24 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 text-base">No foods match your current filters.</p>
            <button
              onClick={() => { setVegFilter('all'); setMealFilter('all'); }}
              className="mt-4 text-orange-400 text-sm underline hover:text-orange-300"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Load More */}
        {!loading && hasMore && filtered.length >= 20 && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              className="bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white
                         border border-orange-500/50 hover:border-orange-500
                         px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              Load More Recommendations
            </button>
          </div>
        )}

        {/* Loading more spinner */}
        {loading && foods.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Recommendations;
