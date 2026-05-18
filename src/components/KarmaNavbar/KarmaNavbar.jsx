import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function KarmaNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Monitor scroll to trigger sticky background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-500 ease-in-out ${
          isScrolled
            ? 'bg-black/40 backdrop-blur-md border-b border-white/5'
            : 'bg-transparent'
        } animate-fade-in`}
        style={{ animationDelay: '200ms' }}
        aria-label="Main Navigation"
      >
        <div className="max-w-[1400px] h-full mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <div className="flex-1 flex justify-start z-50">
            <Link
              to="/"
              className="hover:opacity-80 transition-opacity duration-300 flex items-center"
            >
              <img 
                src={`/images/logo.png?v=${Date.now()}`} 
                alt="Vancar Autos Logo" 
                className="h-8 md:h-10 w-auto object-contain" 
              />
            </Link>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8" aria-label="Desktop Navigation">
            {[
              { label: 'Models & Inventory', path: '/buy' },
              { label: 'Find & Buy', path: '/buy' },
              { label: 'Sell Your Car', path: '/sell' },
              { label: 'About Us', path: '/about' },
              { label: 'News & Reviews', path: '/blog' },
              { label: 'Contact', path: '/contact' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="relative text-white font-light tracking-[0.15em] text-[10px] xl:text-xs uppercase hover:text-white group py-2 transition-all duration-300"
              >
                <span className="opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  {link.label}
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </Link>
            ))}
          </nav>

          {/* Right: Selectors & Owners (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-end items-center space-x-8 text-white">
            {/* UK Selector */}
            <button
              className="flex items-center space-x-2 text-xs font-light tracking-widest uppercase hover:opacity-80 transition-opacity"
              aria-label="Select United Kingdom region"
            >
              <svg className="w-4 h-3 rounded-sm overflow-hidden" viewBox="0 0 60 30" fill="none">
                <clipPath id="s">
                  <rect width="60" height="30"/>
                </clipPath>
                <g clipPath="url(#s)">
                  <rect width="60" height="30" fill="#012169"/>
                  <path d="M0 0 L60 30 M60 0 L0 30" stroke="#FFF" strokeWidth="6"/>
                  <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4"/>
                  {/* St. George Cross */}
                  <path d="M30 0 v30 M0 15 h60" stroke="#FFF" strokeWidth="10"/>
                  <path d="M30 0 v30 M0 15 h60" stroke="#C8102E" strokeWidth="6"/>
                </g>
              </svg>
              <span className="opacity-70 text-[10px]">UK</span>
            </button>

            {/* EU Selector */}
            <button
              className="flex items-center space-x-2 text-xs font-light tracking-widest uppercase hover:opacity-80 transition-opacity"
              aria-label="Select European Union region"
            >
              <svg className="w-4 h-3 rounded-sm overflow-hidden" viewBox="0 0 12 8" fill="none">
                <rect width="12" height="8" fill="#003399" />
                {/* Simplified EU stars ring */}
                <circle cx="6" cy="4" r="1.8" stroke="#FFCC00" strokeWidth="0.3" strokeDasharray="0.3 0.2" fill="none" />
              </svg>
              <span className="opacity-70 text-[10px]">EU</span>
            </button>

            {/* Owners Link */}
            <Link
              to="/admin"
              className="text-xs font-light tracking-[0.2em] uppercase hover:opacity-80 transition-all duration-300 py-1 border-b border-transparent hover:border-white/40"
            >
              Owners
            </Link>
          </div>

          {/* Right Mobile: Hamburger Menu Button */}
          <div className="flex lg:hidden items-center space-x-4 z-50">
            {/* Simplified Region Selector for Mobile */}
            <div className="flex items-center space-x-2 text-white/70 text-[10px] tracking-wider font-light uppercase">
              <span>🇬🇧 UK</span>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:opacity-80 focus:outline-none p-2"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-6 h-5 flex flex-col justify-between relative">
                <span
                  className={`w-full h-[1px] bg-white transition-all duration-300 ease-out origin-center ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[9px]' : ''
                  }`}
                />
                <span
                  className={`w-full h-[1px] bg-white transition-opacity duration-200 ${
                    isMobileMenuOpen ? 'opacity-0' : 'opacity-70'
                  }`}
                />
                <span
                  className={`w-full h-[1px] bg-white transition-all duration-300 ease-out origin-center ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[10px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col justify-between pt-32 pb-12 px-8 transition-all duration-500 ease-in-out ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none -translate-y-4'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <nav className="flex flex-col space-y-8 text-center" aria-label="Mobile Navigation">
          {[
            { label: 'Models & Inventory', path: '/buy' },
            { label: 'Find & Buy', path: '/buy' },
            { label: 'Sell Your Car', path: '/sell' },
            { label: 'About Us', path: '/about' },
            { label: 'News & Reviews', path: '/blog' },
            { label: 'Contact', path: '/contact' },
            { label: 'Owners Portal', path: '/admin' },
          ].map((link, index) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-white text-lg tracking-[0.25em] uppercase font-extralight transition-all duration-500 hover:text-white/80 ${
                isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{
                transitionDelay: `${150 + index * 50}ms`,
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Footer */}
        <div
          className={`flex flex-col items-center space-y-6 text-white border-t border-white/10 pt-8 transition-all duration-700 ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <div className="flex space-x-8">
            <button className="flex items-center space-x-2 text-xs font-light tracking-widest uppercase hover:opacity-80">
              <span>🇬🇧</span>
              <span className="opacity-70 text-[10px]">United Kingdom</span>
            </button>
            <button className="flex items-center space-x-2 text-xs font-light tracking-widest uppercase hover:opacity-80">
              <span>🇪🇺</span>
              <span className="opacity-70 text-[10px]">Europe</span>
            </button>
          </div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-white/40">
            © {new Date().getFullYear()} VANCAR AUTOS LIMITED
          </p>
        </div>
      </div>
    </>
  );
}
