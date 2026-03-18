import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { API_URL } from '../config';
import { trackAddToCart } from '../utils/trackActivity';
import { Rocket, Sparkles, Zap, ShieldCheck, ChevronRight, Info, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImage } from '../utils/imageOptimizer';

// ─── CSS Visual Effects ──────────────────────────────────────────────────────
const SPACE_CSS = `
  @keyframes stars-scroll {
    from { transform: translateY(0); }
    to { transform: translateY(-500px); }
  }
  @keyframes scan {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 0.3; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  @keyframes ufo-bubble-in {
    0% { transform: scale(0) translateY(20px); opacity: 0; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  .star-field-animated {
    animation: stars-scroll 60s linear infinite;
    background-image: 
      radial-gradient(1px 1px at 25px 35px, #fff, rgba(0,0,0,0)),
      radial-gradient(1px 1px at 50px 80px, #fff, rgba(0,0,0,0)),
      radial-gradient(2px 2px at 100px 150px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
      radial-gradient(1.5px 1.5px at 150px 40px, #fff, rgba(0,0,0,0));
    background-size: 500px 500px;
  }
  .premium-glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
  }
  .card-shine::after {
    content: '';
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.03), transparent);
    transform: rotate(45deg);
    transition: 0.6s;
    pointer-events: none;
  }
  .group:hover .card-shine::after {
    left: 100%;
  }
  .ufo-message-bubble {
    animation: ufo-bubble-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

const StarField = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020205]">
    <div className="absolute inset-0 star-field-animated opacity-40" />
    <div className="absolute inset-0 star-field-animated opacity-20 scale-150 rotate-12" />
    <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-orange-950/20" />
  </div>
);

const UFOAssistant = ({ userId }) => {
  const canvasRef = useRef(null);
  const [data, setData] = useState(null);
  const [ufoPos, setUfoPos] = useState({ x: -100, y: 100, opacity: 0 });
  const ufoState = useRef({
    x: -100, y: 100, vx: 0, vy: 0, rotation: 0,
    targetX: 200, targetY: 200, trail: [],
    hidingUntil: 0, opacity: 0
  });

  const fetchMsg = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/recommendations/ufo-message/${userId}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) { console.warn('UFO msg fail'); }
  }, [userId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame;

    const loop = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const u = ufoState.current;
      
      const isHiding = time < u.hidingUntil;
      
      if (isHiding) {
        u.opacity = Math.max(0, u.opacity - 0.1);
      } else {
        u.opacity = Math.min(1, u.opacity + 0.05);
      }

      // Physics (Login-style)
      // ... (existing physics)
      const dx = u.targetX - u.x;
      const dy = u.targetY - u.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < 50) {
        if (Math.random() < 0.02) {
          u.targetX = Math.random() * (canvas.width - 200) + 100;
          u.targetY = Math.random() * (canvas.height - 200) + 100;
        }
      } else {
        u.vx += (dx / dist) * 0.08;
        u.vy += (dy / dist) * 0.08;
      }
      
      u.vx *= 0.97; u.vy *= 0.97;
      u.x += u.vx; u.y += u.vy;
      u.rotation = u.vx * 0.1;
      
      // Intelligent Overlap Detection
      // Check if UFO is over a food card to hide bubble
      const elementsAtPoint = document.elementsFromPoint(u.x, u.y);
      const isOverCard = elementsAtPoint.some(el => el.closest('.premium-card-mockup'));
      
      // Trail
      if (u.opacity > 0.1 && Math.hypot(u.vx, u.vy) > 0.2) {
        u.trail.push({ x: u.x, y: u.y, opacity: u.opacity * 0.6, size: 2 });
      }
      if (u.trail.length > 20) u.trail.shift();
      u.trail.forEach(p => {
        p.opacity -= 0.02;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(0, 255, 200, ${p.opacity})`; ctx.fill();
      });

      if (u.opacity > 0) {
        ctx.save();
        ctx.globalAlpha = u.opacity;
        ctx.translate(u.x, u.y);
        ctx.rotate(u.rotation);
        ctx.shadowColor = 'rgba(0, 255, 150, 0.8)'; ctx.shadowBlur = 15;
        ctx.font = '32px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🛸', 0, 0);
        ctx.restore();
      }

      // Sync state for React bubble (hide if over card)
      setUfoPos({ x: u.x, y: u.y, opacity: isOverCard ? 0 : u.opacity });

      frame = requestAnimationFrame(loop);
    };

    const handleCanvasClick = (e) => {
      const u = ufoState.current;
      const dist = Math.hypot(e.clientX - u.x, e.clientY - u.y);
      if (dist < 40) {
        u.hidingUntil = performance.now() + 2000;
        // Boost velocity away
        u.vx *= 5; u.vy *= 5;
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousedown', handleCanvasClick);
    resize();
    frame = requestAnimationFrame(loop);
    return () => { 
      cancelAnimationFrame(frame); 
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown', handleCanvasClick);
    };
  }, []); // Remove [active] as it's always active now

  useEffect(() => {
    fetchMsg();
    const interval = setInterval(fetchMsg, 60000); // New msg every minute
    return () => clearInterval(interval);
  }, [fetchMsg]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {ufoPos.opacity > 0.5 && data && (
        <div 
          className="absolute ufo-message-bubble"
          style={{ 
            left: ufoPos.x + 30, 
            top: ufoPos.y - 70,
            opacity: ufoPos.opacity,
            transition: 'opacity 0.3s ease, left 0.05s linear, top 0.05s linear'
          }}
        >
          <div className="premium-glass bg-black/80 px-4 py-2.5 rounded-2xl rounded-bl-sm border border-cyan-500/30 shadow-[0_0_20px_rgba(0,255,255,0.1)] max-w-[180px]">
            <p className="text-[11px] font-bold text-cyan-50 leading-tight">
              {data.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};



// ─── Skeleton ───────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 animate-pulse">
    <div className="h-48 bg-white/10" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
      <div className="flex justify-between items-center mt-4">
        <div className="h-5 bg-white/10 rounded w-16" />
        <div className="h-8 bg-cyan-500/20 rounded-xl w-20" />
      </div>
    </div>
  </div>
);

// ─── Food Grid Card ──────────────────────────────────────────────────────────
const FoodGridCard = ({ food, userId, onAdd, index = 0 }) => {
    const isVeg = food.is_veg === true || food.is_veg === 'true' || food.isVeg;
    const rating = parseFloat(food.rating) || 4.2;
    const score = food._score ? (food._score * 100).toFixed(0) : null;
    const [loaded, setLoaded] = React.useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -10 }}
            className="group relative bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/10 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(6,182,212,0.15)] hover:border-cyan-500/30 h-full flex flex-col"
        >
            <div className="relative h-56 overflow-hidden">
                {!loaded && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
                <img
                    src={optimizeImage(food.image || food.imageUrl || food.image_url, 600)}
                    alt={food.name}
                    onLoad={() => setLoaded(true)}
                    className={`w-full h-full object-cover transition-all duration-1000 ${loaded ? 'opacity-90 scale-100 group-hover:opacity-100 group-hover:scale-110' : 'opacity-0 scale-110'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-transparent opacity-80" />
                
                {/* Match Percentage Pill */}
                {score && (
                    <div className="absolute top-5 right-5 z-20">
                        <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30 text-cyan-400 px-4 py-1.5 rounded-full font-black text-[10px] shadow-[0_0_20px_rgba(6,182,212,0.2)] tracking-tighter uppercase animate-pulse-glow">
                            {score}% Match
                        </div>
                    </div>
                )}

                {/* Veg Indicator */}
                <div className={`absolute top-5 left-5 w-5 h-5 rounded-md border flex items-center justify-center bg-white shadow-lg ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow relative z-10">
                <div className="mb-3">
                    <h3 className="text-white font-black text-xl tracking-tight group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">
                        {food.name}
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Star size={12} className="fill-orange-400 text-orange-400" />
                            <span className="text-gray-300 text-xs font-bold">{rating.toFixed(1)}</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-600 rounded-full" />
                        <div className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-gray-400 text-xs font-medium">25-30 mins</span>
                        </div>
                    </div>
                </div>

                <p className="text-gray-400 text-xs font-medium line-clamp-2 mb-6 leading-relaxed opacity-70">
                    {food.description || `Specially curated selection from ${food.restaurant?.name || 'Chef Specialty'}`}
                </p>

                <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Premium Price</span>
                        <span className="font-black text-2xl text-white tracking-tighter">₹{food.price}</span>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { trackAddToCart(userId, food); onAdd(food); }}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-[0_10px_25px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.4)]"
                    >
                        Order Now
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};


// ─── Filter Bar ───────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
      ${active
        ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30'
        : 'bg-white/5 border-white/10 text-gray-400 hover:border-cyan-500/40 hover:text-white'
      }`}
  >
    {label}
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const Recommendations = () => {
    const { user, loading: authLoading } = useAuth();
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
  const [sortBy, setSortBy] = useState('match'); // 'match', 'rating', 'price_lo', 'price_hi'

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
      setFoods(prev => {
        const combined = reset ? newFoods : [...prev, ...newFoods];
        const uniqueMap = new Map();
        combined.forEach(item => {
          const id = item.id || item._id;
          if (id && !uniqueMap.has(id)) {
            uniqueMap.set(id, item);
          }
        });
        return Array.from(uniqueMap.values());
      });
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

  // Apply client-side filters & sorting on the loaded set
  const filtered = foods
    .filter(f => {
      const isVeg = f.is_veg === true || f.is_veg === 'true' || f.isVeg;
      if (vegFilter === 'veg' && !isVeg) return false;
      if (vegFilter === 'non_veg' && isVeg) return false;
      if (mealFilter !== 'all' && f.meal_type && f.meal_type !== 'any' && f.meal_type !== mealFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      if (sortBy === 'price_lo') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
      if (sortBy === 'price_hi') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
      return (b._score || 0) - (a._score || 0); // Default: match score
    });

  const strategyLabel = strategy === 'cold_start'
    ? '🔥 Trending Near You'
    : '✨ Personalised For You';

  const mealIcon = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿' };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#020205] pb-24 relative overflow-hidden">
                <StarField />
                <div className="relative z-20 px-8 pt-12">
                    <div className="max-w-xl mb-12 animate-pulse">
                        <div className="h-4 bg-cyan-500/20 w-48 rounded-full mb-6" />
                        <div className="h-12 bg-white/5 w-96 rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

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
      <UFOAssistant userId={userId} />

      {/* Scanning Light Effect */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute inset-x-0 h-1 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.3)] opacity-0 animate-[scan_15s_linear_infinite]" />
      </div>

      <div className="relative z-20">
      {/* Page Header - Thinned Down */}
      <div className="px-4 md:px-8 pt-8 pb-3 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3 bg-cyan-500/10 w-fit px-4 py-1.5 rounded-full border border-cyan-500/20 backdrop-blur-md">
                <div className="relative">
                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full block animate-pulse-glow" />
                    <span className="absolute inset-0 bg-cyan-400/50 rounded-full animate-ping" />
                </div>
                <span className="text-cyan-400 font-black tracking-[0.2em] text-[10px] uppercase">AI Prediction Engine Active</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500 tracking-tighter leading-[0.9] mb-4">
              {strategyLabel.split(' ').slice(1).join(' ')}
            </h1>
          </div>

          {/* Combined Filters & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-white/5 rounded-lg border border-white/5 p-0.5">
              <FilterChip label="All" active={vegFilter === 'all'} onClick={() => setVegFilter('all')} />
              <FilterChip label="Veg" active={vegFilter === 'veg'} onClick={() => setVegFilter('veg')} />
              <FilterChip label="Non-Veg" active={vegFilter === 'non_veg'} onClick={() => setVegFilter('non_veg')} />
            </div>

            <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-500 uppercase">Sort:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold rounded-lg px-2 py-1 outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="match" className="bg-[#050510]">Best Match</option>
                <option value="rating" className="bg-[#050510]">Rating</option>
                <option value="price_lo" className="bg-[#050510]">Price: Low-High</option>
                <option value="price_hi" className="bg-[#050510]">Price: High-Low</option>
              </select>
            </div>
            
            <div className="w-full md:w-auto flex gap-1.5 overflow-x-auto hide-scrollbar pt-2 md:pt-0">
              {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                <button
                  key={type}
                  onClick={() => setMealFilter(p => p === type ? 'all' : type)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${mealFilter === type ? 'bg-cyan-500 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-white/5 border-white/5 text-gray-400'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Explainer */}
        {explanation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-8 relative group max-w-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent blur-3xl -z-10 opacity-30" />
            <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl flex items-center gap-4 group-hover:border-cyan-500/30 transition-colors">
              <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2.5 rounded-2xl text-white shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <p className="text-gray-300 text-sm md:text-base italic leading-relaxed font-semibold tracking-tight">
                "{explanation}"
              </p>
            </div>
          </motion.div>
        )}
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
              className="bg-cyan-500/10 hover:bg-white text-cyan-400 hover:text-black
                         border border-cyan-500/50 hover:border-white
                         px-8 py-3 rounded-xl font-bold transition-all duration-300 uppercase tracking-widest text-[11px]"
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
