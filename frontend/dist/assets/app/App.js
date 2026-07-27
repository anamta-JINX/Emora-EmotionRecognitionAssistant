import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import HomePage from './pages/HomePage.js';
import FeaturesPage from './pages/FeaturesPage.js';
import ResearchPage from './pages/ResearchPage.js';
import TeamPage from './pages/TeamPage.js';
import FaqPage from './pages/FaqPage.js';
import FeedbackPage from './pages/FeedbackPage.js';
import ProfilePage from './pages/ProfilePage.js';
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
        if (!location.hash)
            window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname, location.hash]);
    useEffect(() => {
        if (!location.hash)
            return;
        const target = document.querySelector(location.hash);
        if (target)
            requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth' }));
    }, [location]);
    return null;
}
export default function App() {
    return (React.createElement("div", { className: "page-shell" },
        React.createElement(RouteEffects, null),
        React.createElement(Navbar, null),
        React.createElement("main", null,
            React.createElement(Routes, null,
                React.createElement(Route, { path: "/", element: React.createElement(HomePage, null) }),
                React.createElement(Route, { path: "/home", element: React.createElement(HomePage, null) }),
                React.createElement(Route, { path: "/features", element: React.createElement(FeaturesPage, null) }),
                React.createElement(Route, { path: "/research", element: React.createElement(ResearchPage, null) }),
                React.createElement(Route, { path: "/team", element: React.createElement(TeamPage, null) }),
                React.createElement(Route, { path: "/faq", element: React.createElement(FaqPage, null) }),
                React.createElement(Route, { path: "/feedback", element: React.createElement(FeedbackPage, null) }),
                React.createElement(Route, { path: "/profile", element: React.createElement(ProfilePage, null) }),
                React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/", replace: true }) }))),
        React.createElement(Footer, null)));
}
