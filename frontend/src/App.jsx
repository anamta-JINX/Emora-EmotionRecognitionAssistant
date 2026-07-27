import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import ResearchPage from './pages/ResearchPage';
import TeamPage from './pages/TeamPage';
import FaqPage from './pages/FaqPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';

const pageTitles = {
  '/': 'EMORA — Emotion Recognition Assistant',
  '/home': 'EMORA — Emotion Recognition Assistant',
  '/features': 'Features — EMORA',
  '/research': 'Research — EMORA',
  '/team': 'Team — EMORA',
  '/faq': 'FAQ — EMORA',
  '/feedback': 'Feedback — EMORA',
  '/profile': 'Profile — EMORA',
};

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    document.title = pageTitles[location.pathname] ?? 'EMORA';
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth' }));
  }, [location]);

  return null;
}

export default function App() {
  return (
    <div className="page-shell">
      <RouteEffects />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
