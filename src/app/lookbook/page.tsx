"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";

const LOOKS = [
    {
        id: 1,
        title: "The Royal Sabyasachi",
        category: "Bridal",
        image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=1000&auto=format&fit=crop",
        size: "large"
    },
    {
        id: 2,
        title: "Pastel Elegance",
        category: "Engagement",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop",
        size: "medium"
    },
    {
        id: 3,
        title: "Golden Hour Glow",
        category: "Reception",
        image: "https://images.unsplash.com/photo-1610030469983-982149090623?q=80&w=1000&auto=format&fit=crop",
        size: "small"
    },
    {
        id: 4,
        title: "Velvet Nights",
        category: "Winter Wear",
        image: "https://images.unsplash.com/photo-1589131008225-c650339d3322?q=80&w=1000&auto=format&fit=crop",
        size: "large"
    },
    {
        id: 5,
        title: "Traditional Roots",
        category: "Haldi",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop",
        size: "medium"
    },
    {
        id: 6,
        title: "Modern Muse",
        category: "Cocktail",
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop",
        size: "small"
    }
];

export default function LookbookPage() {
    const [filter, setFilter] = useState("All");

    const categories = ["All", ...new Set(LOOKS.map(l => l.category))];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-[1400px] mx-auto px-4 pt-40 pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-script text-gray-900 mb-4">The Lookbook</h1>
                    <p className="text-gray-500 uppercase tracking-widest text-xs">Curated Styles & Inspiration</p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap justify-center gap-6 mb-12">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`text-xs uppercase tracking-[0.2em] transition-all pb-1 border-b ${filter === cat ? "border-black text-black font-bold" : "border-transparent text-gray-400 hover:text-black"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Masonry-style Grid */}
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
                    {LOOKS.filter(l => filter === "All" || l.category === filter).map((look) => (
                        <div key={look.id} className="break-inside-avoid group cursor-pointer">
                            <div className="relative overflow-hidden bg-gray-100">
                                <img
                                    src={look.image}
                                    alt={look.title}
                                    className="w-full transform transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <div className="text-white">
                                        <p className="text-[10px] uppercase tracking-widest mb-1 opacity-80">{look.category}</p>
                                        <h3 className="text-lg font-medium">{look.title}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />

            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap');
                .font-script {
                    font-family: 'Playfair Display', serif;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
