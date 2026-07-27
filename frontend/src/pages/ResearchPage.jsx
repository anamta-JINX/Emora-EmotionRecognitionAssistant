import {
  ArrowDown,
  BrainCircuit,
  Database,
  Image,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';

const pipeline = [
  [Image, 'Input frame', 'The route decodes an uploaded image or webcam data URL into an OpenCV image.'],
  [ScanFace, 'Face preparation', 'Gamma adjustment, grayscale conversion, CLAHE, and Haar cascade detection isolate visible faces.'],
  [BrainCircuit, 'Model inference', 'Each face is resized to 48×48 grayscale and passed to the lazily loaded emotion model.'],
  [Target, 'Output annotation', 'The backend draws the face box and label, then returns the annotated PNG and main emotion label.'],
];

export default function ResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Research & development"
        title="An assistive system shaped around clarity, context, and responsible use."
        description="EMORA explores how facial-expression classification can offer an additional social cue without pretending that emotion can be reduced to one prediction."
      />

      <section className="pb-24 sm:pb-28">
        <div className="container-page">
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal className="surface p-8 sm:p-10">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-moss-100 text-moss-700"><Target size={24} /></span>
              <h2 className="mt-7 font-display text-2xl font-extrabold tracking-[-0.04em]">Problem statement</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">Some neurodivergent people may find facial expressions difficult to interpret consistently. EMORA is designed as an optional, immediate cue that can reduce uncertainty while leaving room for context, direct communication, and individual differences.</p>
            </Reveal>
            <Reveal delay={100} className="surface p-8 sm:p-10">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-peach-100 text-peach-500"><ShieldCheck size={24} /></span>
              <h2 className="mt-7 font-display text-2xl font-extrabold tracking-[-0.04em]">Responsible framing</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">A facial expression is not proof of someone’s internal state. The frontend deliberately describes results as supportive signals, avoids certainty language, and reminds users to consider conversation and context.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-white sm:py-24 lg:py-28">
        <div className="container-page">
          <Reveal className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-moss-300"><Sparkles size={14} /> Existing backend pipeline</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">From browser frame to annotated result.</h2>
            <p className="mt-5 text-base leading-8 text-slate-300">The interface changes completely; the prediction flow below remains the project’s original Flask and OpenCV implementation.</p>
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-4">
            {pipeline.map(([Icon, title, text], index) => (
              <Reveal key={title} delay={index * 90} className="relative rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur">
                <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-moss-400/10 text-moss-200"><Icon size={21} /></span><span className="font-display text-xs font-extrabold text-white/25">0{index + 1}</span></div>
                <h3 className="mt-6 font-display text-lg font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
                {index < pipeline.length - 1 && <ArrowDown size={18} className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-moss-600 p-1 text-white lg:-right-3 lg:bottom-auto lg:left-auto lg:top-1/2 lg:-translate-y-1/2 lg:rotate-[-90deg]" />}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-page grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <Reveal>
            <span className="eyebrow"><Database size={14} /> Model lifecycle</span>
            <h2 className="display-title mt-6">Lazy loading keeps the web app usable during setup.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">The Flask application starts without loading TensorFlow immediately. On the first prediction request, it looks for the base model in <strong className="text-ink">backend/models/emora_model.h5</strong>. A missing model returns a readable 503 response instead of breaking the website at startup.</p>
          </Reveal>
          <Reveal delay={100} className="rounded-[34px] border border-moss-100 bg-canvas p-6 sm:p-8">
            <div className="rounded-[25px] bg-ink p-6 font-mono text-xs leading-7 text-slate-300 shadow-soft sm:text-sm">
              <p><span className="text-peach-300">POST</span> /predict_image</p>
              <p className="mt-3 text-slate-500">→ decode uploaded image</p>
              <p className="text-slate-500">→ detect visible faces</p>
              <p className="text-slate-500">→ load model on demand</p>
              <p className="text-slate-500">→ predict seven-class label</p>
              <p className="text-slate-500">→ encode annotated PNG</p>
              <div className="mt-5 rounded-xl bg-white/5 p-4 text-moss-200">{'{ "label": "Happy", "image_base64": "data:image/png…" }'}</div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
