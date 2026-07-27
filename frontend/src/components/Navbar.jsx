import { useEffect, useState } from 'react';
import { Menu, Sparkles, UserRound, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';

const navItems = [
  ['Home', '/home'],
  ['Features', '/features'],
  ['Research', '/research'],
  ['Team', '/team'],
  ['FAQ', '/faq'],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-moss-100/80 bg-canvas/90 shadow-sm backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="container-page flex h-[76px] items-center justify-between">
        <Logo light={!scrolled && isHome} />

        <nav className="hidden items-center gap-1 rounded-full border border-white/80 bg-white/70 p-1.5 shadow-sm backdrop-blur-lg lg:flex" aria-label="Primary navigation">
          {navItems.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive || (path === '/home' && location.pathname === '/') ? 'bg-ink text-white shadow-sm' : 'text-slate-600 hover:bg-moss-50 hover:text-ink'}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/profile" className="grid h-11 w-11 place-items-center rounded-full border border-moss-100 bg-white text-slate-600 transition hover:border-moss-300 hover:bg-moss-50 hover:text-moss-700" aria-label="Profile">
            <UserRound size={18} />
          </Link>
          <Link to="/home#workspace" className="button-primary px-5 py-3">
            <Sparkles size={16} />
            Try EMORA
          </Link>
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border border-moss-100 bg-white text-ink lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`overflow-hidden border-t border-moss-100 bg-canvas/95 backdrop-blur-xl transition-all duration-300 lg:hidden ${open ? 'max-h-[430px] opacity-100' : 'max-h-0 border-transparent opacity-0'}`}>
        <nav className="container-page flex flex-col gap-1 py-5" aria-label="Mobile navigation">
          {navItems.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `rounded-2xl px-4 py-3 text-sm font-semibold ${isActive || (path === '/home' && location.pathname === '/') ? 'bg-ink text-white' : 'text-slate-700 hover:bg-moss-50'}`}
            >
              {label}
            </NavLink>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link to="/profile" className="button-secondary rounded-2xl"><UserRound size={16} /> Profile</Link>
            <Link to="/home#workspace" className="button-primary rounded-2xl"><Sparkles size={16} /> Try EMORA</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
