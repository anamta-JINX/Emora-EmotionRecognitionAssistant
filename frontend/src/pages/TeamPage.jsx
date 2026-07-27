import { Code2, Github, HeartHandshake, Lightbulb, Mail, Sparkles } from 'lucide-react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';

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
  return (
    <>
      <PageHero
        eyebrow="The people behind EMORA"
        title="A student-built project with a human reason to exist."
        description="EMORA combines software engineering, machine learning, research, and accessible design around one goal: making social cues easier to approach."
      />

      <section className="pb-24 sm:pb-28">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {people.map((person, index) => (
            <Reveal key={person.name} delay={index * 110} className="group relative overflow-hidden rounded-[34px] border border-moss-100 bg-white p-7 shadow-card transition duration-300 hover:-translate-y-2 hover:shadow-soft sm:p-10">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-moss-50 transition duration-500 group-hover:scale-125" />
              <div className="relative">
                <span className="grid h-20 w-20 place-items-center rounded-[26px] bg-ink font-display text-2xl font-extrabold text-white shadow-lg">{person.initials}</span>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.15em] text-moss-600">{person.role}</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em]">{person.name}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">{person.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="container-page">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="eyebrow"><HeartHandshake size={14} /> Shared purpose</span>
            <h2 className="display-title mt-6">Built at the intersection of care and engineering.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [Lightbulb, 'Purposeful idea', 'Start with a real accessibility challenge, not technology for its own sake.'],
              [Code2, 'Practical building', 'Turn research and model work into an interface people can actually use.'],
              [Sparkles, 'Continuous refinement', 'Improve detection, usability, language, and responsible framing over time.'],
            ].map(([Icon, title, text], index) => (
              <Reveal key={title} delay={index * 90} className="rounded-[28px] border border-moss-100 bg-canvas p-7 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-moss-100 text-moss-700"><Icon size={23} /></span>
                <h3 className="mt-5 font-display text-lg font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <Reveal className="rounded-[36px] bg-ink p-8 text-white sm:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-300">Connect with the project</p><h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Feedback and thoughtful collaboration are welcome.</h2></div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href="mailto:anamta.gohar25@gmail.com" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink transition hover:-translate-y-1"><Mail size={17} /> Email us</a>
                <a href="https://github.com/anamta-JINX" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-white/10"><Github size={17} /> GitHub</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
