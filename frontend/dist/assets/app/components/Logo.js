import { Link } from 'react-router-dom';
export default function Logo({ light = false }) {
    return (React.createElement(Link, { to: "/", className: "group flex items-center gap-3", "aria-label": "EMORA home" },
        React.createElement("span", { className: `grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border shadow-sm transition duration-300 group-hover:-rotate-3 group-hover:scale-105 ${light ? 'border-white/15 bg-white/10' : 'border-moss-100 bg-white'}` },
            React.createElement("img", { src: "/app/imgs/Elogo.png", alt: "", className: "h-8 w-8 object-contain" })),
        React.createElement("span", { className: "leading-none" },
            React.createElement("span", { className: `block font-display text-lg font-extrabold tracking-[-0.04em] ${light ? 'text-white' : 'text-ink'}` }, "EMORA"),
            React.createElement("span", { className: `mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] ${light ? 'text-moss-200' : 'text-moss-600'}` }, "Emotion assistant"))));
}
