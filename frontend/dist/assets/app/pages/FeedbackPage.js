import { useMemo, useState } from 'react';
import { ArrowRight, Bug, Lightbulb, Mail, MessageSquareHeart, Send, Sparkles } from 'lucide-react';
import PageHero from '../components/PageHero.js';
import Reveal from '../components/Reveal.js';
const categories = [
    { value: 'General feedback', label: 'General', icon: MessageSquareHeart },
    { value: 'Bug report', label: 'Bug', icon: Bug },
    { value: 'Feature suggestion', label: 'Feature', icon: Lightbulb },
    { value: 'Research comment', label: 'Research', icon: Sparkles },
];
export default function FeedbackPage() {
    const [form, setForm] = useState({ name: '', email: '', category: 'General feedback', message: '' });
    const [validation, setValidation] = useState('');
    const emailHref = useMemo(() => {
        const subject = encodeURIComponent(`[EMORA] ${form.category}`);
        const body = encodeURIComponent(`Name: ${form.name || 'Not provided'}\nReply email: ${form.email || 'Not provided'}\nCategory: ${form.category}\n\n${form.message}`);
        return `mailto:anamta.gohar25@gmail.com?subject=${subject}&body=${body}`;
    }, [form]);
    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setValidation('');
    }
    function submit(event) {
        event.preventDefault();
        if (form.message.trim().length < 10) {
            setValidation('Please add at least 10 characters so the feedback has enough detail.');
            return;
        }
        window.location.href = emailHref;
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHero, { eyebrow: "Share feedback", title: "Help make EMORA clearer, safer, and more useful.", description: "Report a problem, suggest an improvement, or share a research perspective. This form prepares an email without adding a new backend route." }),
        React.createElement("section", { className: "pb-24 sm:pb-28" },
            React.createElement("div", { className: "container-page grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start" },
                React.createElement(Reveal, { className: "rounded-[32px] bg-ink p-8 text-white lg:sticky lg:top-28" },
                    React.createElement("span", { className: "grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-moss-200" },
                        React.createElement(Mail, { size: 23 })),
                    React.createElement("h2", { className: "mt-7 font-display text-3xl font-extrabold tracking-[-0.04em]" }, "Your experience can shape the next version."),
                    React.createElement("p", { className: "mt-4 text-sm leading-7 text-slate-300" }, "Useful feedback explains what happened, what you expected, and what would make the experience better."),
                    React.createElement("div", { className: "mt-8 space-y-4 border-t border-white/10 pt-7 text-sm text-slate-300" },
                        React.createElement("p", { className: "flex items-center gap-3" },
                            React.createElement("span", { className: "grid h-8 w-8 place-items-center rounded-full bg-moss-400/10 text-moss-200" }, "1"),
                            " Choose the closest category."),
                        React.createElement("p", { className: "flex items-center gap-3" },
                            React.createElement("span", { className: "grid h-8 w-8 place-items-center rounded-full bg-moss-400/10 text-moss-200" }, "2"),
                            " Describe the exact situation."),
                        React.createElement("p", { className: "flex items-center gap-3" },
                            React.createElement("span", { className: "grid h-8 w-8 place-items-center rounded-full bg-moss-400/10 text-moss-200" }, "3"),
                            " Your email client opens with the draft."))),
                React.createElement(Reveal, { delay: 100 },
                    React.createElement("form", { onSubmit: submit, className: "surface p-6 sm:p-9" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "text-xs font-extrabold uppercase tracking-[0.14em] text-moss-700" }, "Feedback type"),
                            React.createElement("div", { className: "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" }, categories.map(({ value, label, icon: Icon }) => (React.createElement("button", { key: value, type: "button", onClick: () => update('category', value), className: `flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-xs font-bold transition ${form.category === value ? 'border-ink bg-ink text-white shadow-sm' : 'border-moss-100 bg-white text-slate-600 hover:border-moss-300 hover:bg-moss-50'}` },
                                React.createElement(Icon, { size: 19 }),
                                " ",
                                label))))),
                        React.createElement("div", { className: "mt-7 grid gap-5 sm:grid-cols-2" },
                            React.createElement("label", { className: "block" },
                                React.createElement("span", { className: "mb-2 block text-sm font-bold text-ink" },
                                    "Name ",
                                    React.createElement("span", { className: "font-normal text-slate-400" }, "(optional)")),
                                React.createElement("input", { className: "field", value: form.name, onChange: (event) => update('name', event.target.value), placeholder: "Your name" })),
                            React.createElement("label", { className: "block" },
                                React.createElement("span", { className: "mb-2 block text-sm font-bold text-ink" },
                                    "Email ",
                                    React.createElement("span", { className: "font-normal text-slate-400" }, "(optional)")),
                                React.createElement("input", { type: "email", className: "field", value: form.email, onChange: (event) => update('email', event.target.value), placeholder: "you@example.com" }))),
                        React.createElement("label", { className: "mt-5 block" },
                            React.createElement("span", { className: "mb-2 block text-sm font-bold text-ink" }, "What should we know?"),
                            React.createElement("textarea", { className: "field min-h-48 resize-y", value: form.message, onChange: (event) => update('message', event.target.value), placeholder: "Describe what happened, what you expected, and any steps that reproduce the issue\u2026" })),
                        validation && React.createElement("p", { className: "mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" }, validation),
                        React.createElement("div", { className: "mt-6 flex flex-col gap-3 border-t border-moss-100 pt-6 sm:flex-row sm:items-center sm:justify-between" },
                            React.createElement("p", { className: "max-w-sm text-xs leading-5 text-slate-500" }, "Submitting opens your default email application. No feedback endpoint was added to Flask."),
                            React.createElement("button", { type: "submit", className: "button-primary rounded-2xl px-6 py-3.5" },
                                React.createElement(Send, { size: 17 }),
                                " Prepare email ",
                                React.createElement(ArrowRight, { size: 16 })))))))));
}
