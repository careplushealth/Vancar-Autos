import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function KarmaNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Monitor scroll to trigger sticky background shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
        className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 ease-in-out bg-white ${
          isScrolled ? 'shadow-md border-b border-slate-100' : 'border-b border-slate-100/80'
        }`}
        aria-label="Main Navigation"
      >
        <div className="max-w-[1400px] h-full mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <div className="flex-1 flex justify-start z-50">
            <Link
              to="/"
              className="hover:opacity-90 transition-opacity duration-300 flex items-center"
            >
              <img 
                src={`/images/logo.png?v=${Date.now()}`} 
                alt="Vancar Autos Logo" 
                className="h-10 md:h-12 w-auto object-contain" 
              />
            </Link>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-8" aria-label="Desktop Navigation">
            {[
              { label: 'View Stock', path: '/buy' },
              { label: 'Sell Your Car', path: '/sell' },
              { label: 'About Us', path: '/about' },
              { label: 'Blog & News', path: '/blog' },
              { label: 'Contact', path: '/contact' },
            ].map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`relative font-semibold text-sm tracking-wide py-2 transition-colors duration-300 group ${
                    isActive ? 'text-[var(--color-accent)]' : 'text-slate-800 hover:text-[var(--color-accent)]'
                  }`}
                >
                  <span>{link.label}</span>
                  <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-accent)] transition-transform duration-300 origin-left ease-out ${
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-end items-center space-x-4">
            <Link
              to="/admin"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mr-2"
            >
              Portal
            </Link>
            <Link
              to="/buy"
              className="btn btn--primary btn--sm shadow-sm"
            >
              View Stock
            </Link>
            <Link
              to="/contact"
              className="btn btn--sm shadow-sm bg-[var(--color-info)] text-slate-900 border border-[var(--color-info)] hover:bg-[#e6c200] hover:border-[#e6c200] hover:-translate-y-[2px]"
            >
              Contact Us
            </Link>
          </div>

          {/* Right Mobile: Hamburger Menu Button */}
          <div className="flex lg:hidden items-center space-x-4 z-50">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-800 hover:text-[var(--color-accent)] focus:outline-none p-2"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-6 h-5 flex flex-col justify-between relative">
                <span
                  className={`w-full h-[2px] bg-current transition-all duration-300 ease-out origin-center ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[9px]' : ''
                  }`}
                />
                <span
                  className={`w-full h-[2px] bg-current transition-opacity duration-200 ${
                    isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`w-full h-[2px] bg-current transition-all duration-300 ease-out origin-center ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-white flex flex-col justify-between pt-28 pb-12 px-8 transition-all duration-500 ease-in-out ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none -translate-y-4'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <nav className="flex flex-col space-y-6 text-center" aria-label="Mobile Navigation">
          {[
            { label: 'View Stock', path: '/buy' },
            { label: 'Sell Your Car', path: '/sell' },
            { label: 'About Us', path: '/about' },
            { label: 'Blog & News', path: '/blog' },
            { label: 'Contact Us', path: '/contact' },
            { label: 'Admin Portal', path: '/admin' },
          ].map((link, index) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-xl font-bold tracking-wide uppercase transition-all duration-500 ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-slate-800 hover:text-[var(--color-accent)]'
                } ${
                  isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{
                  transitionDelay: `${150 + index * 50}ms`,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Footer */}
        <div
          className={`flex flex-col items-center space-y-6 text-slate-800 border-t border-slate-100 pt-8 transition-all duration-700 ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <div className="flex flex-col space-y-2 text-center text-sm font-medium text-slate-500">
            <span>Call us: 0161 123 4567</span>
            <span>Email: info@vancarautos.co.uk</span>
          </div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400">
            © {new Date().getFullYear()} VANCAR AUTOS LIMITED
          </p>
        </div>
      </div>
    </>
  );
}
