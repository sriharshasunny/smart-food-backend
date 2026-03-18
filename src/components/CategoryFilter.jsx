import React from 'react';

const CategoryFilter = ({ categories, activeCategory, onSelectCategory, isSticky }) => {
    // STICKY MODE: Text-only Pills
    if (isSticky) {
        return (
            <div data-lenis-prevent className="w-full overflow-x-auto pb-0 hide-scrollbar animate-fade-in-down">
                <div className="flex gap-2 px-0 items-center h-full">
                    {/* All Option */}
                    <button
                        onClick={() => onSelectCategory('All')}
                        className={`flex-shrink-0 h-10 px-5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all flex items-center gap-3 border ${activeCategory === 'All'
                            ? 'bg-gray-900 text-white border-transparent shadow-lg transform scale-105'
                            : 'bg-gray-50 text-gray-500 hover:bg-white hover:text-black border-transparent hover:border-gray-200'
                            }`}
                    >
                        All
                    </button>

                    {/* Categories */}
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onSelectCategory(cat.name)}
                            className={`flex-shrink-0 h-10 px-5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all flex items-center gap-3 border ${activeCategory === cat.name
                                ? 'bg-orange-500 text-white border-transparent shadow-lg transform scale-105'
                                : 'bg-gray-50 text-gray-500 hover:bg-white hover:text-black border-transparent hover:border-gray-200'
                                }`}
                        >
                            <img src={cat.image} alt={cat.name} className="w-6 h-6 rounded-full object-cover shadow-sm bg-white" />
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // DEFAULT MODE: Image Circles
    return (
        <div data-lenis-prevent className="w-full overflow-x-auto pb-6 hide-scrollbar pt-4">
            <div className="flex gap-8 px-4 sm:px-0 items-end">
                {/* All Option */}
                <button
                    onClick={() => onSelectCategory('All')}
                    className={`flex-shrink-0 flex flex-col items-center gap-4 transition-all duration-300 ${activeCategory === 'All' ? 'scale-110' : 'opacity-70 hover:opacity-100 hover:-translate-y-1'}`}
                >
                    <div className={`
                        w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 relative
                        ${activeCategory === 'All'
                            ? 'bg-gray-900 shadow-[0_20px_40px_rgba(0,0,0,0.2)] ring-4 ring-gray-100 animate-float'
                            : 'bg-white shadow-sm border border-gray-100'
                        }
                    `}>
                        <span className={`font-black text-xs tracking-widest ${activeCategory === 'All' ? 'text-white' : 'text-gray-400'}`}>ALL</span>
                        {activeCategory === 'All' && (
                            <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                            </div>
                        )}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${activeCategory === 'All' ? 'text-gray-900' : 'text-gray-400'}`}>
                        Everything
                    </span>
                </button>

                {/* Category items */}
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelectCategory(cat.name)}
                        className={`flex-shrink-0 flex flex-col items-center gap-4 group transition-all duration-500 ${activeCategory === cat.name ? 'scale-110' : 'hover:-translate-y-2'}`}
                    >
                        <div className="relative">
                            {activeCategory === cat.name && (
                                <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse" />
                            )}
                            <div className={`
                                relative w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-700
                                ${activeCategory === cat.name ? 'animate-float shadow-[0_25px_50px_rgba(249,115,22,0.25)]' : 'bg-transparent group-hover:shadow-lg'}
                            `}>
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className={`w-28 h-28 max-w-none object-cover aspect-square drop-shadow-2xl transition-all duration-700 rounded-full ${activeCategory === cat.name ? 'scale-110 rotate-3' : 'grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105'}`}
                                />
                                {activeCategory === cat.name && (
                                    <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse-glow" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 py-1 px-4 rounded-full ${activeCategory === cat.name ? 'text-white bg-orange-500 shadow-lg shadow-orange-500/30' : 'text-gray-400 group-hover:text-gray-900 group-hover:bg-gray-100'}`}>
                            {cat.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategoryFilter;
