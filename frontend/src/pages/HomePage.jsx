import {
  ArrowRight,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Eye,
  HeartHandshake,
  ImageUp,
  Layers3,
  LockKeyhole,
  MessageCircleHeart,
  ScanFace,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EmotionWorkspace from '../components/EmotionWorkspace';
import Reveal from '../components/Reveal';

const benefits = [
  {
    icon: Eye,
    title: 'A clearer social cue',
    text: 'Turn a facial expression into a simple label that is easier to interpret in the moment.',
  },
  {
    icon: HeartHandshake,
    title: 'Support, not judgement',
    text: 'EMORA presents results as helpful clues and keeps context and human communication central.',
  },
  {
    icon: LockKeyhole,
    title: 'A focused workflow',
    text: 'Use one calm workspace for image upload and live webcam analysis without visual overload.',
  },
];

const steps = [
  ['01', 'Provide a frame', 'Upload an image or allow webcam access from localhost or HTTPS.', ImageUp],
  ['02', 'Find the face', 'The backend detects a visible face and prepares it for model inference.', ScanFace],
  ['03', 'Read the result', 'EMORA returns an annotated image and one of seven emotion labels.', MessageCircleHeart],
];

export default function HomePage() {
  return (
    <>
      <header className="emora-old-hero">
        <div aria-hidden="true" className="emora-old-hero-shapes">
          <span className="emora-old-blob emora-old-blob-one" />
          <span className="emora-old-blob emora-old-blob-two" />
          <span className="emora-old-blob emora-old-blob-three" />
          <span className="emora-old-blob emora-old-blob-four" />
        </div>

        <div className="emora-old-hero-content">
          <span className="emora-old-kicker emora-old-fade-up">Real-Time Emotion Recognition</span>

          <h1 className="emora-old-title emora-old-fade-up">
            Welcome to <span>EMORA</span>
          </h1>

          <p className="emora-old-subtitle emora-old-fade-up emora-old-delay-1">
            Because <em>reading the room</em> can be tricky.
          </p>

          <p className="emora-old-description emora-old-fade-up emora-old-delay-2">
            A calm, real-time tool designed to help autistic and neurodivergent individuals
            recognize facial emotions with clarity and confidence.
          </p>

          <a href="#workspace" className="emora-old-cta emora-old-fade-up emora-old-delay-3">
            Try It Now <ArrowRight size={18} />
          </a>
        </div>

        <div className="emora-old-scroll" aria-hidden="true">
          <span>Scroll</span>
          <div />
        </div>
      </header>

      <section className="border-y border-moss-100 bg-white py-7">
        <div className="container-page grid grid-cols-3 divide-x divide-moss-100 text-center">
          <div><p className="font-display text-2xl font-extrabold text-ink sm:text-3xl">7</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">Emotion classes</p></div>
          <div><p className="font-display text-2xl font-extrabold text-ink sm:text-3xl">2</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">Input modes</p></div>
          <div><p className="font-display text-2xl font-extrabold text-ink sm:text-3xl">48×48</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">Model input</p></div>
        </div>
      </section>

      <section className="section-pad bg-canvas">
        <div className="container-page">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Why EMORA</span>
            <h2 className="display-title mt-6">Technology that leaves room for empathy.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">Facial expressions can be useful signals, but they are never the whole story. EMORA keeps the result simple and the language careful.</p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 90} className="surface h-full p-7 transition duration-300 hover:-translate-y-2 hover:border-moss-200 hover:shadow-soft">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-moss-100 text-moss-700"><Icon size={24} /></span>
                <h3 className="mt-6 font-display text-xl font-extrabold tracking-[-0.03em]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <EmotionWorkspace />

      <section className="section-pad bg-white">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <Reveal className="lg:sticky lg:top-28">
              <span className="eyebrow">How it works</span>
              <h2 className="display-title mt-6">A simple path from frame to insight.</h2>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">The React interface handles interaction and calls the same Flask endpoints already used by the original frontend.</p>
              <Link to="/features" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-moss-700 transition hover:gap-3">See every feature <ArrowRight size={17} /></Link>
            </Reveal>

            <div className="space-y-4">
              {steps.map(([number, title, text, Icon], index) => (
                <Reveal key={number} delay={index * 100} className="group flex gap-5 rounded-[28px] border border-moss-100 bg-canvas p-6 transition duration-300 hover:border-moss-200 hover:bg-moss-50 sm:gap-7 sm:p-8">
                  <div className="flex flex-col items-center">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink font-display text-sm font-extrabold text-white transition group-hover:-rotate-3 group-hover:bg-moss-700">{number}</span>
                    {index < steps.length - 1 && <span className="mt-3 h-full w-px bg-moss-200" />}
                  </div>
                  <div className="pt-1">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-moss-700 shadow-sm"><Icon size={19} /></span>
                    <h3 className="mt-4 font-display text-xl font-extrabold tracking-[-0.03em]">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24 lg:pb-28">
        <div className="container-page">
          <Reveal className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-moss-700 via-moss-800 to-ink p-8 text-white shadow-soft sm:p-12 lg:p-16">
            <div className="hero-grid absolute inset-0 opacity-20" />
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-peach-300/20 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-moss-200"><Layers3 size={15} /> Built for continued learning</span>
                <h2 className="mt-5 max-w-3xl font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">Explore the thinking, architecture, and purpose behind EMORA.</h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Read the project approach, understand the detection pipeline, and see where the work can grow next.</p>
              </div>
              <Link to="/research" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-extrabold text-ink transition hover:-translate-y-1 hover:shadow-xl">View research <ArrowRight size={17} /></Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
