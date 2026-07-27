import Reveal from './Reveal';

export default function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pb-24 sm:pt-40">
      <div className="hero-grid absolute inset-0 opacity-70" />
      <div className="glow-orb absolute -left-32 top-12 h-72 w-72 rounded-full bg-moss-200/60 blur-3xl" />
      <div className="glow-orb absolute -right-24 top-32 h-64 w-64 rounded-full bg-peach-200/55 blur-3xl [animation-delay:2s]" />
      <div className="container-page relative text-center">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display-title mx-auto mt-6 max-w-4xl">{title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
