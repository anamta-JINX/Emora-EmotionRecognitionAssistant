export default function Reveal({ children, className = '', delay = 0 }) {
    return (React.createElement("div", { className: `reveal is-visible ${className}`, style: { animationDelay: `${delay}ms` } }, children));
}
