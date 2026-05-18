import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function KarmaHero() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animations on load
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative w-full h-screen overflow-hidden bg-black flex items-center"
      aria-label="Cinematic Showcase"
    >
      {/* Background Autoplay Video */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${animate ? 'scale-105' : 'scale-100'
            }`}
          poster="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80"
        >
          <source
            src="/hero.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Subtle Dark Luxury Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-black/70 pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Decorative Lines (Karma Style) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-hidden" aria-hidden="true">
        {/* Left Decorative Line */}
        <svg
          className="absolute left-0 top-[35%] w-[35%] h-[40px] text-white/25 hidden md:block"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 30 L 150 30 L 180 10 L 400 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Right Decorative Line */}
        <svg
          className="absolute right-0 top-[35%] w-[35%] h-[40px] text-white/25 hidden md:block"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 400 30 L 250 30 L 220 10 L 0 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Hero Content Area */}
      <div className="relative z-30 max-w-[1400px] mx-auto w-full px-6 md:px-12 lg:px-20 h-full flex flex-col justify-end pb-[12vh]">
        <div
          className={`max-w-2xl text-left transition-all duration-[1200ms] ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
        >
          {/* Small Heading */}
          <span className="block text-white text-sm md:text-base font-light tracking-[0.4em] uppercase mb-4 opacity-90">
            Luxury Looks
          </span>

          {/* Large Heading */}
          <h1 className="text-white font-extralight tracking-widest text-[clamp(1.75rem,5.5vw,4.5rem)] leading-[1.15] mb-8 font-luxury">
            Affordable Prices
          </h1>

          {/* Call to Actions - Seamlessly integrated */}
          <div className="flex flex-wrap gap-6 pt-2">
            <Link
              to="/buy"
              className="px-8 py-3.5 bg-white text-black text-xs font-light tracking-[0.2em] uppercase hover:bg-black hover:text-white hover:border-white/50 border border-transparent transition-all duration-500 rounded-sm"
            >
              View Latest Offers
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 bg-transparent text-white border border-white/20 text-xs font-light tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-500 rounded-sm"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
