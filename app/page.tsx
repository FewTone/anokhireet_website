"use client";

import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden text-brand-beige bg-radial-brand"
    >
      {/* Side Decorations - Full Height Pattern on each side */}
      <div className="absolute left-0 top-0 h-full w-24 md:w-56 pointer-events-none opacity-100">
        {isMounted && (
          <Image
            src="/assets/floral-border.png"
            alt="Left Decoration"
            fill
            className="object-fill object-left"
          />
        )}
      </div>

      <div className="absolute right-0 top-0 h-full w-24 md:w-56 pointer-events-none opacity-100">
        {isMounted && (
          <Image
            src="/assets/floral-border.png"
            alt="Right Decoration"
            fill
            className="object-fill object-right scale-x-[-1]"
          />
        )}
      </div>


      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="flex flex-col items-center z-10 w-full px-4"
      >
        {/* Top Text - "Coming Soon" */}
        <h1 className="text-2xl md:text-5xl font-serif mb-8 tracking-wider text-center text-[#E8E5C3]">
          We are Launching Soon
        </h1>

        {/* Central Mandala / Logo */}
        <div className="relative w-72 h-72 md:w-[36rem] md:h-[36rem] flex items-center justify-center mb-0">

          {/* Main Mandala Pattern - Rotating */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-full h-full opacity-60"
          >
            {isMounted && (
              <Image
                src="/assets/mandala.png"
                alt="Mandala Pattern"
                fill
                className="object-contain"
              />
            )}
          </motion.div>

          {/* Central Logo - Fixed */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-40 h-40 md:w-64 md:h-64 pointer-events-none">
              {isMounted && (
                <Image
                  src="/assets/logo.png"
                  alt="Anokhi Reet Logo"
                  fill
                  className="object-contain drop-shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-[10px] md:text-sm tracking-[0.4em] font-sans uppercase opacity-70">
            FOLLOW US FOR MORE UPDATES
          </p>
          <a
            href="https://instagram.com/anokhireet.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Instagram size={18} />
            <span className="font-serif text-lg md:text-xl">@anokhireet.in</span>
          </a>
        </div>
      </motion.div>
    </main>
  );
}

