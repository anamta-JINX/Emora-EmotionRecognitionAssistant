import {
  Accessibility,
  Camera,
  CircleGauge,
  ImageUp,
  Layers3,
  LockKeyhole,
  MonitorSmartphone,
  ScanFace,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';

const features = [
  [ScanFace, 'Facial emotion analysis', 'Detect a visible face and classify the expression into Angry, Disgust, Fear, Happy, Sad, Surprise, or Neutral.'],
  [ImageUp, 'Drag-and-drop uploads', 'Select JPG, PNG, or WEBP images through a clear upload experience with preview and file validation.'],
  [Camera, 'Live webcam capture', 'Start the camera, align the face guide, capture a frame, and send it to the existing Flask webcam route.'],
  [WandSparkles, 'Annotated results', 'Review the processed frame with the detected face box and emotion label returned by the backend.'],
  [CircleGauge, 'Clear system states', 'See ready, loading, result, no-face, offline, and model-configuration states without cryptic UI failures.'],
  [Accessibility, 'Low-overload interface', 'Large targets, careful spacing, readable hierarchy, reduced-motion support, and calm visual feedback.'],
  [MonitorSmartphone, 'Responsive layout', 'Use the React interface across laptop, tablet, and mobile sizes without losing core functionality.'],
  [LockKeyhole, 'No new backend dependency', 'The interface uses the original /predict_image, /predict_webcam, and /health routes as they are.'],
  [Layers3, 'Reusable React architecture', 'Shared navigation, page layouts, components, state handling, and a Vite production build replace duplicated HTML.'],
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Product capabilities"
        title="Everything needed for a clear, focused emotion-recognition flow."
        description="The React frontend turns EMORA into one consistent product experience while preserving the original Flask prediction backend."
      >
        <Link to="/home#workspace" className="button-primary mt-8 px-7 py-4"><Sparkles size={17} /> Open live workspace</Link>
      </PageHero>

      <section className="pb-24 sm:pb-28">
        <div className="container-page grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([Icon, title, description], index) => (
            <Reveal key={title} delay={(index % 3) * 80} className={`group surface h-full p-7 transition duration-300 hover:-translate-y-2 hover:shadow-soft ${index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-moss-100 text-moss-700 transition duration-300 group-hover:rotate-3 group-hover:bg-ink group-hover:text-white"><Icon size={24} /></span>
                <span className="font-display text-xs font-extrabold text-moss-300">0{index + 1}</span>
              </div>
              <h2 className="mt-7 font-display text-xl font-extrabold tracking-[-0.03em] text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="container-page">
          <Reveal className="grid overflow-hidden rounded-[36px] bg-ink text-white lg:grid-cols-2">
            <div className="p-8 sm:p-12 lg:p-14">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-moss-300"><Sparkles size={14} /> Frontend upgrade</span>
              <h2 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">One source of truth instead of eight duplicated pages.</h2>
              <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">React Router controls page views, shared components keep the interface consistent, and the production build is synchronized into every existing Flask template route.</p>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {['Reusable components', 'Client-side routing', 'Tailwind design system', 'Vite production build'].map((item) => (
                <div key={item} className="flex min-h-28 items-center gap-3 bg-white/[0.04] p-7"><span className="h-2 w-2 rounded-full bg-peach-300" /><p className="text-sm font-bold text-white">{item}</p></div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
