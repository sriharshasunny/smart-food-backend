import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, Trash2, ArrowRight, ShoppingBag, Zap, Receipt, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

/* ─── Status Config ─────────────────────────────────────────────────────────── */
const statusConfig = {
    Delivered:  { color: 'text-emerald-400',  bg: 'bg-emerald-500/15',  border: 'border-emerald-500/40',  bar: 'bg-emerald-500',  glow: '0 0 16px rgba(52,211,153,0.35)', icon: CheckCircle },
    Confirmed:  { color: 'text-orange-400',   bg: 'bg-orange-500/15',   border: 'border-orange-500/40',   bar: 'bg-orange-500',   glow: '0 0 16px rgba(249,115,22,0.35)',  icon: Zap },
    Pending:    { color: 'text-amber-400',    bg: 'bg-amber-500/15',    border: 'border-amber-500/40',    bar: 'bg-amber-500',    glow: '0 0 16px rgba(245,158,11,0.35)',  icon: Clock },
    Cancelled:  { color: 'text-red-400',      bg: 'bg-red-500/15',      border: 'border-red-500/40',      bar: 'bg-red-500',      glow: '0 0 16px rgba(239,68,68,0.35)',   icon: XCircle },
};

const getStatus = (s) => statusConfig[s] || statusConfig.Pending;

/* ─── CSS ───────────────────────────────────────────────────────────────────── */
const ORDERS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
  @keyframes float-orb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%       { transform: translate(3%, 4%) scale(1.05); }
  }
  @keyframes shimmer-sweep {
    0%   { transform: translateX(-120%) skewX(-20deg); }
    100% { transform: translateX(220%) skewX(-20deg); }
  }
  @keyframes badge-glow-pulse {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1; }
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .card-shimmer { position: relative; overflow: hidden; }
  .card-shimmer::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
    animation: shimmer-sweep 4s ease-in-out infinite;
    pointer-events: none;
  }
  .badge-glow { animation: badge-glow-pulse 2.5s ease-in-out infinite; }
  .timeline-dot::before {
    content: '';
    position: absolute;
    left: -1px; top: 100%;
    width: 2px;
    background: linear-gradient(to bottom, rgba(255,165,0,0.4), transparent);
    height: 2rem;
  }
`;

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */
const OrderSkeleton = () => (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-6 animate-pulse">
        <div className="flex justify-between mb-5">
            <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="space-y-2">
                    <div className="h-4 w-36 bg-white/10 rounded-full" />
                    <div className="h-3 w-24 bg-white/10 rounded-full" />
                </div>
            </div>
            <div className="h-8 w-24 bg-white/10 rounded-full" />
        </div>
        <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(i => <div key={i} className="h-7 w-28 bg-white/8 rounded-full" />)}
        </div>
    </div>
);

/* ─── Order Card ─────────────────────────────────────────────────────────────── */
const OrderCard = ({ order, index }) => {
    const cfg = getStatus(order.orderStatus);
    const StatusIcon = cfg.icon;
    const date = new Date(order.createdAt);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative group"
        >
            {/* Timeline connector */}
            {index > 0 && (
                <div className="absolute -top-6 left-[27px] w-0.5 h-6 bg-gradient-to-b from-orange-500/30 to-transparent" />
            )}

            <div
                className="relative bg-[#111118]/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden
                           hover:border-orange-500/30 transition-all duration-500 card-shimmer
                           hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
            >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.bar} rounded-l-2xl`}
                     style={{ boxShadow: cfg.glow }} />

                {/* Inner content */}
                <div className="p-5 pl-6">

                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-4">
                            {/* Icon circle */}
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border} badge-glow`}
                                 style={{ boxShadow: cfg.glow }}>
                                <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="mono font-black text-white text-sm tracking-tight">
                                        #{order._id.slice(-8).toUpperCase()}
                                    </h3>
                                    {/* Status Badge */}
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border mono ${cfg.color} ${cfg.bg} ${cfg.border}`}
                                        style={{ boxShadow: cfg.glow }}
                                    >
                                        {order.orderStatus}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {dateStr} · {timeStr}
                                </p>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="text-right shrink-0">
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mono mb-0.5">Total</p>
                            <p className="text-2xl font-black text-white mono">₹{order.totalAmount}</p>
                        </div>
                    </div>

                    {/* Items as chips */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {order.items.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10
                                           hover:border-orange-500/30 hover:bg-orange-500/5 transition-colors duration-300"
                            >
                                <span className="mono text-[10px] font-black text-orange-400">{item.quantity}×</span>
                                <span className="text-[11px] font-semibold text-gray-300">{item.name}</span>
                                <span className="mono text-[10px] text-gray-600">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/8">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-500 font-semibold">Payment Confirmed</span>
                        </div>
                        <Link
                            to={`/orders/${order._id || order.id}/invoice`}
                            className="group/inv flex items-center gap-1.5 px-4 py-2 rounded-full
                                       bg-orange-500/10 hover:bg-orange-500 border border-orange-500/30 hover:border-orange-400
                                       text-orange-400 hover:text-black text-[11px] font-black uppercase tracking-wider mono
                                       transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                        >
                            <Receipt className="w-3 h-3" />
                            Invoice
                            <ArrowRight className="w-3 h-3 group-hover/inv:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
const Orders = () => {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(true);

    const fetchOrders = async () => {
        if (authLoading || !user?._id) { setFetchLoading(false); return; }
        try {
            const res = await fetch(`${API_URL}/api/orders?userId=${user._id}`);
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => { if (!authLoading) fetchOrders(); }, [user, authLoading]);

    const clearHistory = async () => {
        if (!confirm('Delete all order history?')) return;
        try {
            await fetch(`${API_URL}/api/orders?userId=${user._id}`, { method: 'DELETE' });
            setOrders([]);
        } catch (err) { console.error(err); }
    };

    const totalSpent = orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);

    /* ── Loading ── */
    if (fetchLoading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0c0c14] via-[#111118] to-[#0c0c14] pt-24 px-4">
                <style>{ORDERS_CSS}</style>
                <div className="max-w-3xl mx-auto space-y-4">
                    {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden pb-20 pt-24 px-4 sm:px-6 lg:px-8"
             style={{ background: 'linear-gradient(135deg, #0c0c14 0%, #111118 50%, #0c0c14 100%)' }}>
            <style>{ORDERS_CSS}</style>

            {/* Ambient glow blobs */}
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[160px] rounded-full pointer-events-none"
                 style={{ animation: 'float-orb 30s ease-in-out infinite' }} />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[140px] rounded-full pointer-events-none"
                 style={{ animation: 'float-orb 40s ease-in-out infinite reverse' }} />

            <div className="max-w-3xl mx-auto relative z-10">

                {/* ── Page Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <span className="mono text-[10px] font-black text-orange-500/70 uppercase tracking-[0.3em]">
                                    Order History
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight"
                                style={{ background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Your Orders
                            </h1>
                            {orders.length > 0 && (
                                <p className="text-gray-500 text-sm mt-2 mono">
                                    {orders.length} order{orders.length !== 1 ? 's' : ''} · ₹{totalSpent.toLocaleString('en-IN')} total spent
                                </p>
                            )}
                        </div>

                        {/* Stats chip + Clear */}
                        <div className="flex flex-col items-end gap-3 shrink-0">
                            {orders.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                                        <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                                        <span className="mono text-[11px] font-black text-orange-300">{orders.length} Orders</span>
                                    </div>
                                    <button
                                        onClick={clearHistory}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20
                                                   text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-bold mono uppercase tracking-wider"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── Empty State ── */}
                {orders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-28 text-center"
                    >
                        <div className="relative mb-8">
                            <div className="w-28 h-28 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                <ShoppingBag className="w-12 h-12 text-orange-500/60" />
                            </div>
                            <div className="absolute inset-0 rounded-full border border-orange-500/10 animate-ping" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">No Orders Yet</h2>
                        <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed">
                            Your order history will appear here once you place your first order.
                        </p>
                        <Link
                            to="/restaurants"
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-black text-sm
                                       bg-orange-500 hover:bg-orange-400 text-black transition-all
                                       hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] active:scale-95"
                        >
                            Browse Food <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                ) : (
                    /* ── Order List ── */
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <OrderCard key={order._id} order={order} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
