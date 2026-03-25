import React, { memo, useState } from 'react';
import { Star, Clock, Heart, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { optimizeImage } from '../utils/imageOptimizer';

const RestaurantCard = memo(({ restaurant }) => {
    const { id, name, image, rating, cuisine, deliveryTime, tags, categories } = restaurant || {};
    const { isInWishlist, toggleWishlist } = useShop();
    const [imageLoaded, setImageLoaded] = useState(false);

    const isWishlisted = isInWishlist(id);
    const cuisineText = Array.isArray(cuisine)
        ? cuisine.join(', ')
        : (cuisine || (Array.isArray(categories) ? categories.join(', ') : 'Restaurant'));
    const fallbackImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';
    const ratingNum = parseFloat(rating || 4.0).toFixed(1);

    return (
        <Link to={`/restaurant/${id}`} className="block group h-full">
            <div
                style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)',
                    borderRadius: '1.25rem',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
                    border: '1.5px solid #f0f0f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                }}
                className="hover:border-orange-300 hover:shadow-orange-100"
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(249,115,22,0.15), 0 4px 12px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)'; }}
            >
                {/* ── Image ── */}
                <div style={{ position: 'relative', height: '175px', flexShrink: 0, overflow: 'hidden', background: '#f3f4f6' }}>
                    {!imageLoaded && (
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                    )}
                    <img
                        src={optimizeImage(image || fallbackImage, 500)}
                        alt={name}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            transition: 'transform 0.6s ease, opacity 0.3s ease',
                            opacity: imageLoaded ? 1 : 0,
                        }}
                        className="group-hover:scale-105"
                    />

                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)' }} />

                    {/* Delivery time badge */}
                    <div style={{
                        position: 'absolute', top: 10, left: 10, zIndex: 10,
                        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                        borderRadius: '10px', padding: '5px 10px',
                        display: 'flex', alignItems: 'center', gap: 5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>
                        <Clock style={{ width: 12, height: 12, color: '#f97316' }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#111', letterSpacing: '0.04em' }}>
                            {deliveryTime || '25-30 MIN'}
                        </span>
                    </div>

                    {/* Wishlist button */}
                    <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWishlist(restaurant); }}
                        style={{
                            position: 'absolute', top: 10, right: 10, zIndex: 10,
                            width: 32, height: 32, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isWishlisted ? '#ef4444' : 'rgba(255,255,255,0.92)',
                            backdropFilter: 'blur(8px)',
                            border: isWishlisted ? 'none' : '1.5px solid rgba(255,255,255,0.6)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            cursor: 'pointer', transition: 'all 0.25s ease',
                        }}
                    >
                        <Heart style={{ width: 14, height: 14, color: isWishlisted ? '#fff' : '#9ca3af', fill: isWishlisted ? '#fff' : 'none' }} />
                    </button>

                    {/* Rating + Premium badge at bottom */}
                    <div style={{
                        position: 'absolute', bottom: 10, left: 10, zIndex: 10,
                        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
                        borderRadius: '10px', padding: '6px 10px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#fb923c' }}>{ratingNum}</span>
                        <Star style={{ width: 11, height: 11, fill: '#fb923c', color: '#fb923c' }} />
                        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)' }} />
                        <Zap style={{ width: 9, height: 9, color: '#fb923c' }} />
                        <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Premium</span>
                    </div>

                    {/* Fast delivery tag */}
                    {(parseInt(deliveryTime) || 99) <= 30 && (
                        <div style={{
                            position: 'absolute', bottom: 10, right: 10, zIndex: 10,
                            background: 'linear-gradient(135deg, #f97316, #ef4444)',
                            borderRadius: '8px', padding: '4px 8px',
                        }}>
                            <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>⚡ Fast</span>
                        </div>
                    )}
                </div>

                {/* ── Info ── */}
                <div style={{ padding: '12px 14px 12px', display: 'flex', flexDirection: 'column', flex: 1, background: '#fff' }}>
                    <h3 style={{
                        fontSize: 15, fontWeight: 900, color: '#111', letterSpacing: '-0.02em',
                        marginBottom: 3, lineHeight: 1.3, textTransform: 'uppercase',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.2s',
                    }} className="group-hover:text-orange-500">
                        {name || 'Restaurant Name'}
                    </h3>
                    <p style={{
                        fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
                        letterSpacing: '0.1em', marginBottom: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {cuisineText}
                    </p>

                    <div style={{
                        marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f5f5f5',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: 10,
                    }}>
                        <span style={{
                            fontSize: 9, fontWeight: 900, color: '#f97316',
                            background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                            padding: '5px 10px', borderRadius: '8px',
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            border: '1px solid #fed7aa',
                        }}>
                            Free Delivery
                        </span>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            fontSize: 9, fontWeight: 900, color: '#d1d5db',
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            transition: 'color 0.2s',
                        }} className="group-hover:text-gray-800">
                            Explore <ChevronRight style={{ width: 12, height: 12 }} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});

export default RestaurantCard;
