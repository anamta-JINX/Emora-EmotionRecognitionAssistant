import { ArrowUpRight, Github, Heart, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 opacity-[0.06] hero-grid" />
      <div className="container-page relative py-14 sm:py-16">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.2fr_.8fr_.8fr]">
          <div className="max-w-md">
            <Logo light />
            <p className="mt-5 text-sm leading-7 text-slate-300">
              A calm emotion-recognition assistant designed to support clarity, confidence, and more accessible social understanding.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="mailto:anamta.gohar25@gmail.com" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-1 hover:bg-white/10 hover:text-white" aria-label="Email EMORA"><Mail size={18} /></a>
              <a href="https://github.com/anamta-JINX" target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-1 hover:bg-white/10 hover:text-white" aria-label="GitHub"><Github size={18} /></a>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-300">Explore</p>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <Link to="/features" className="transition hover:text-white">Features</Link>
              <Link to="/research" className="transition hover:text-white">Research</Link>
              <Link to="/team" className="transition hover:text-white">Meet the team</Link>
              <Link to="/faq" className="transition hover:text-white">FAQ</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-300">Get involved</p>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <Link to="/feedback" className="flex items-center gap-2 transition hover:text-white">Share feedback <ArrowUpRight size={14} /></Link>
              <Link to="/profile" className="transition hover:text-white">Accessibility profile</Link>
              <a href="mailto:anamta.gohar25@gmail.com" className="transition hover:text-white">Contact the creators</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 EMORA. Built by Anamta & Eman.</p>
          <p className="flex items-center gap-1.5">Designed with <Heart size={13} className="text-peach-300" fill="currentColor" /> for clarity, calm, and support.</p>
        </div>
      </div>
    </footer>
  );
}
