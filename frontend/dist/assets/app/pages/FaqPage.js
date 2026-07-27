import { useState } from 'react';
import { Camera, ChevronDown, HelpCircle, ImageUp, LockKeyhole, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.js';
import Reveal from '../components/Reveal.js';
const faqs = [
    {
        question: 'Does EMORA work in real time?',
        answer: 'Yes. The webcam mode captures a current camera frame and submits it to the Flask /predict_webcam route. The result is returned immediately after backend processing.',
    },
    {
        question: 'Can I use an image instead of a camera?',
        answer: 'Yes. Upload a JPG, PNG, or WEBP file up to 10 MB. The React interface previews the image before submitting it to /predict_image.',
    },
    {
        question: 'Which emotions can the model identify?',
        answer: 'The current backend defines seven labels: Angry, Disgust, Fear, Happy, Sad, Surprise, and Neutral.',
    },
    {
        question: 'What happens when no face is visible?',
        answer: 'The result panel explains that no clear face was found and suggests better lighting, a front-facing angle, and moving closer. It does not crash on an empty label.',
    },
    {
        question: 'Why does EMORA say the model is not configured?',
        answer: 'The website can start without the trained TensorFlow file. To enable predictions, place emora_model.h5 in backend/models/ and restart Flask.',
    },
    {
        question: 'Does the prediction route permanently save my uploaded image?',
        answer: 'The current prediction routes decode and process the submitted image for the response; they do not contain a step that writes uploaded prediction images to disk. Separate training and feedback scripts may manage their own data.',
    },
    {
        question: 'Is a detected label definitely what someone feels?',
        answer: 'No. Facial expression classification is imperfect and cannot know a person’s internal experience. Treat the result as one possible cue and rely on context and direct communication.',
    },
    {
        question: 'Who is EMORA designed for?',
        answer: 'The project is intended as a supportive accessibility tool for neurodivergent users, caregivers, educators, researchers, and people exploring assistive emotion-recognition interfaces.',
    },
];
function AccordionItem({ item, open, onToggle }) {
    return (React.createElement("div", { className: `overflow-hidden rounded-[24px] border bg-white transition duration-300 ${open ? 'border-moss-300 shadow-card' : 'border-moss-100 hover:border-moss-200'}` },
        React.createElement("button", { type: "button", onClick: onToggle, className: "flex w-full items-center justify-between gap-5 p-5 text-left sm:p-6", "aria-expanded": open },
            React.createElement("span", { className: "font-display text-base font-extrabold tracking-[-0.02em] text-ink sm:text-lg" }, item.question),
            React.createElement("span", { className: `grid h-9 w-9 shrink-0 place-items-center rounded-full transition duration-300 ${open ? 'rotate-180 bg-ink text-white' : 'bg-moss-50 text-moss-700'}` },
                React.createElement(ChevronDown, { size: 17 }))),
        React.createElement("div", { className: `grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}` },
            React.createElement("div", { className: "overflow-hidden" },
                React.createElement("p", { className: "border-t border-moss-100 px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6" }, item.answer)))));
}
export default function FaqPage() {
    const [active, setActive] = useState(0);
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHero, { eyebrow: "Frequently asked questions", title: "Clear answers before you start.", description: "Learn how the current EMORA project handles images, camera access, model setup, interpretation, and privacy." }),
        React.createElement("section", { className: "pb-24 sm:pb-28" },
            React.createElement("div", { className: "container-page grid gap-10 lg:grid-cols-[.65fr_1.35fr] lg:items-start" },
                React.createElement(Reveal, { className: "lg:sticky lg:top-28" },
                    React.createElement("div", { className: "rounded-[30px] bg-ink p-7 text-white sm:p-8" },
                        React.createElement("span", { className: "grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-moss-200" },
                            React.createElement(HelpCircle, { size: 24 })),
                        React.createElement("h2", { className: "mt-6 font-display text-2xl font-extrabold tracking-[-0.04em]" }, "Need a practical answer?"),
                        React.createElement("p", { className: "mt-4 text-sm leading-7 text-slate-300" }, "Most setup problems come from camera permissions, an unavailable Flask server, or a missing model file."),
                        React.createElement(Link, { to: "/home#workspace", className: "mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink transition hover:-translate-y-1" },
                            React.createElement(Sparkles, { size: 16 }),
                            " Test the workspace")),
                    React.createElement("div", { className: "mt-4 grid grid-cols-3 gap-2" }, [Camera, ImageUp, LockKeyhole].map((Icon, index) => React.createElement("span", { key: index, className: "grid h-20 place-items-center rounded-2xl border border-moss-100 bg-white text-moss-600" },
                        React.createElement(Icon, { size: 22 }))))),
                React.createElement("div", { className: "space-y-3" }, faqs.map((item, index) => (React.createElement(Reveal, { key: item.question, delay: (index % 4) * 50 },
                    React.createElement(AccordionItem, { item: item, open: active === index, onToggle: () => setActive(active === index ? -1 : index) })))))))));
}
