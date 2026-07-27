import { Code2, Github, HeartHandshake, Lightbulb, Mail, Sparkles } from 'lucide-react';
import PageHero from '../components/PageHero.js';
import Reveal from '../components/Reveal.js';
const people = [
    {
        name: 'Anamta Gohar',
        role: 'Co-creator · AI & platform development',
        description: 'Contributes to EMORA’s product vision, model workflow, interface direction, and full-stack implementation with a focus on accessible technology.',
        initials: 'AG',
    },
    {
        name: 'Eman',
        role: 'Co-creator · Research & experience design',
        description: 'Helps shape the project structure, supporting research, user experience, and the practical execution of the emotion-recognition assistant.',
        initials: 'E',
    },
];
export default function TeamPage() {
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHero, { eyebrow: "The people behind EMORA", title: "A student-built project with a human reason to exist.", description: "EMORA combines software engineering, machine learning, research, and accessible design around one goal: making social cues easier to approach." }),
        React.createElement("section", { className: "pb-24 sm:pb-28" },
            React.createElement("div", { className: "container-page grid gap-6 md:grid-cols-2" }, people.map((person, index) => (React.createElement(Reveal, { key: person.name, delay: index * 110, className: "group relative overflow-hidden rounded-[34px] border border-moss-100 bg-white p-7 shadow-card transition duration-300 hover:-translate-y-2 hover:shadow-soft sm:p-10" },
                React.createElement("div", { className: "absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-moss-50 transition duration-500 group-hover:scale-125" }),
                React.createElement("div", { className: "relative" },
                    React.createElement("span", { className: "grid h-20 w-20 place-items-center rounded-[26px] bg-ink font-display text-2xl font-extrabold text-white shadow-lg" }, person.initials),
                    React.createElement("p", { className: "mt-8 text-xs font-bold uppercase tracking-[0.15em] text-moss-600" }, person.role),
                    React.createElement("h2", { className: "mt-3 font-display text-3xl font-extrabold tracking-[-0.04em]" }, person.name),
                    React.createElement("p", { className: "mt-4 text-sm leading-7 text-slate-600" }, person.description))))))),
        React.createElement("section", { className: "bg-white py-20 sm:py-24" },
            React.createElement("div", { className: "container-page" },
                React.createElement(Reveal, { className: "mx-auto max-w-3xl text-center" },
                    React.createElement("span", { className: "eyebrow" },
                        React.createElement(HeartHandshake, { size: 14 }),
                        " Shared purpose"),
                    React.createElement("h2", { className: "display-title mt-6" }, "Built at the intersection of care and engineering.")),
                React.createElement("div", { className: "mt-12 grid gap-5 md:grid-cols-3" }, [
                    [Lightbulb, 'Purposeful idea', 'Start with a real accessibility challenge, not technology for its own sake.'],
                    [Code2, 'Practical building', 'Turn research and model work into an interface people can actually use.'],
                    [Sparkles, 'Continuous refinement', 'Improve detection, usability, language, and responsible framing over time.'],
                ].map(([Icon, title, text], index) => (React.createElement(Reveal, { key: title, delay: index * 90, className: "rounded-[28px] border border-moss-100 bg-canvas p-7 text-center" },
                    React.createElement("span", { className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-moss-100 text-moss-700" },
                        React.createElement(Icon, { size: 23 })),
                    React.createElement("h3", { className: "mt-5 font-display text-lg font-extrabold" }, title),
                    React.createElement("p", { className: "mt-3 text-sm leading-7 text-slate-600" }, text))))))),
        React.createElement("section", { className: "section-pad" },
            React.createElement("div", { className: "container-page" },
                React.createElement(Reveal, { className: "rounded-[36px] bg-ink p-8 text-white sm:p-12" },
                    React.createElement("div", { className: "grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-xs font-bold uppercase tracking-[0.16em] text-moss-300" }, "Connect with the project"),
                            React.createElement("h2", { className: "mt-4 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl" }, "Feedback and thoughtful collaboration are welcome.")),
                        React.createElement("div", { className: "flex flex-col gap-3 sm:flex-row" },
                            React.createElement("a", { href: "mailto:anamta.gohar25@gmail.com", className: "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink transition hover:-translate-y-1" },
                                React.createElement(Mail, { size: 17 }),
                                " Email us"),
                            React.createElement("a", { href: "https://github.com/anamta-JINX", target: "_blank", rel: "noreferrer", className: "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-white/10" },
                                React.createElement(Github, { size: 17 }),
                                " GitHub"))))))));
}
