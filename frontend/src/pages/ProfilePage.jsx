import { useEffect, useState } from 'react';
import { Accessibility, Check, Moon, RotateCcw, Save, SlidersHorizontal, Sparkles, Type } from 'lucide-react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';

const defaults = {
  displayName: '',
  guidance: 'balanced',
  reduceMotion: false,
  largeText: false,
  highContrast: false,
};

export default function ProfilePage() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem('emora-profile') || 'null');
      if (existing) {
        const merged = { ...defaults, ...existing };
        setSettings(merged);
        document.documentElement.classList.toggle('emora-large-text', merged.largeText);
        document.documentElement.classList.toggle('emora-high-contrast', merged.highContrast);
        document.documentElement.classList.toggle('emora-reduce-motion', merged.reduceMotion);
      }
    } catch {
      // Ignore malformed local data and use defaults.
    }
  }, []);

  function update(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem('emora-profile', JSON.stringify(settings));
    document.documentElement.classList.toggle('emora-large-text', settings.largeText);
    document.documentElement.classList.toggle('emora-high-contrast', settings.highContrast);
    document.documentElement.classList.toggle('emora-reduce-motion', settings.reduceMotion);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function reset() {
    setSettings(defaults);
    localStorage.removeItem('emora-profile');
    document.documentElement.classList.remove('emora-large-text', 'emora-high-contrast', 'emora-reduce-motion');
    setSaved(false);
  }

  return (
    <>
      <PageHero
        eyebrow="Accessibility profile"
        title="Keep the experience comfortable for you."
        description="These optional preferences are stored only in this browser. They do not change the Flask backend or the emotion model."
      />

      <section className="pb-24 sm:pb-28">
        <div className="container-page grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <Reveal className="rounded-[32px] bg-ink p-8 text-white lg:sticky lg:top-28">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-moss-200"><Accessibility size={24} /></span>
            <h2 className="mt-7 font-display text-3xl font-extrabold tracking-[-0.04em]">Personal without an account system.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">The original backend has no authentication or profile API. This page therefore keeps lightweight interface preferences in localStorage.</p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs leading-6 text-slate-300"><strong className="text-white">Stored locally:</strong> display name, guidance style, motion preference, text size, and contrast preference.</div>
          </Reveal>

          <Reveal delay={100} className="surface p-6 sm:p-9">
            <div className="flex items-center gap-3 border-b border-moss-100 pb-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-moss-100 text-moss-700"><SlidersHorizontal size={20} /></span><div><h2 className="font-display text-xl font-extrabold">Interface preferences</h2><p className="mt-1 text-xs text-slate-500">Saved on this device only</p></div></div>

            <label className="mt-7 block"><span className="mb-2 block text-sm font-bold">Display name <span className="font-normal text-slate-400">(optional)</span></span><input className="field" value={settings.displayName} onChange={(event) => update('displayName', event.target.value)} placeholder="How should EMORA address you?" /></label>

            <fieldset className="mt-7"><legend className="text-sm font-bold">Result guidance style</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ['minimal', 'Minimal', 'Label only'],
                ['balanced', 'Balanced', 'Label + short cue'],
                ['supportive', 'Supportive', 'More context'],
              ].map(([value, label, description]) => (
                <button key={value} type="button" onClick={() => update('guidance', value)} className={`rounded-2xl border p-4 text-left transition ${settings.guidance === value ? 'border-ink bg-ink text-white' : 'border-moss-100 bg-white hover:border-moss-300 hover:bg-moss-50'}`}><span className="text-sm font-bold">{label}</span><span className={`mt-1 block text-xs ${settings.guidance === value ? 'text-slate-300' : 'text-slate-500'}`}>{description}</span></button>
              ))}
            </div></fieldset>

            <div className="mt-7 space-y-3">
              {[
                ['reduceMotion', 'Reduce motion', 'Minimize decorative animations and transitions.', Moon],
                ['largeText', 'Larger text', 'Increase the general reading size for this browser.', Type],
                ['highContrast', 'Higher contrast', 'Strengthen visual separation between surfaces.', Sparkles],
              ].map(([field, label, description, Icon]) => (
                <label key={field} className="flex cursor-pointer items-center gap-4 rounded-2xl border border-moss-100 bg-white p-4 transition hover:border-moss-200 hover:bg-moss-50/50">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-moss-100 text-moss-700"><Icon size={19} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>
                  <input type="checkbox" checked={settings[field]} onChange={(event) => update(field, event.target.checked)} className="peer sr-only" />
                  <span className="relative h-7 w-12 shrink-0 rounded-full bg-slate-200 transition peer-checked:bg-moss-600 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5" />
                </label>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-moss-100 pt-6 sm:flex-row sm:justify-end">
              <button type="button" onClick={reset} className="button-secondary rounded-2xl"><RotateCcw size={17} /> Reset</button>
              <button type="button" onClick={save} className="button-primary min-w-40 rounded-2xl">{saved ? <Check size={17} /> : <Save size={17} />}{saved ? 'Saved locally' : 'Save preferences'}</button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
