import { ScanFace } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className="group flex items-center gap-3"
      aria-label="EMORA home"
    >
      <span
        className={`grid h-10 w-10 place-items-center rounded-2xl border shadow-sm transition duration-300 group-hover:-rotate-3 group-hover:scale-105 ${
          light
            ? 'border-white/20 bg-ink/30 text-white backdrop-blur-sm'
            : 'border-moss-100 bg-white text-moss-700'
        }`}
      >
        <ScanFace
          size={24}
          strokeWidth={2.1}
          aria-hidden="true"
        />
      </span>

      <span className="leading-none">
        <span
          className={`block font-display text-lg font-extrabold tracking-[-0.04em] ${
            light ? 'text-white' : 'text-ink'
          }`}
        >
          EMORA
        </span>

        <span
          className={`mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] ${
            light ? 'text-moss-200' : 'text-moss-600'
          }`}
        >
          Emotion assistant
        </span>
      </span>
    </Link>
  );
}
