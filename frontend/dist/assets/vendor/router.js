
import React, { useEffect, useState } from 'react';

const subscribers = new Set();
function snapshot() {
  return { pathname: window.location.pathname || '/', search: window.location.search || '', hash: window.location.hash || '' };
}
function emit() { const value = snapshot(); subscribers.forEach((listener) => listener(value)); }
window.addEventListener('popstate', emit);
window.addEventListener('hashchange', emit);

function navigate(to, replace) {
  const target = new URL(to, window.location.origin === 'null' ? 'https://emora.local' : window.location.origin);
  const value = target.pathname + target.search + target.hash;
  if (replace) window.history.replaceState({}, '', value); else window.history.pushState({}, '', value);
  emit();
}

export function useLocation() {
  const [location, setLocation] = useState(snapshot());
  useEffect(() => { subscribers.add(setLocation); return () => subscribers.delete(setLocation); }, []);
  return location;
}

export function BrowserRouter({ children }) {
  useLocation();
  return children;
}

export function Link({ to, onClick, target, children, ...props }) {
  function handleClick(event) {
    if (onClick) onClick(event);
    if (event.defaultPrevented || target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(to, false);
  }
  return React.createElement('a', { ...props, href: to, target, onClick: handleClick }, children);
}

export function NavLink({ to, className, children, ...props }) {
  const location = useLocation();
  const target = new URL(to, window.location.origin);
  const isActive = location.pathname === target.pathname;
  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;
  return React.createElement(Link, { ...props, to, className: resolvedClass }, typeof children === 'function' ? children({ isActive }) : children);
}

export function Route() { return null; }

export function Routes({ children }) {
  const location = useLocation();
  const routes = React.Children.toArray(children);
  let fallback = null;
  for (const route of routes) {
    if (!route || !route.props) continue;
    if (route.props.path === '*') fallback = route.props.element;
    else if (route.props.path === location.pathname) return route.props.element;
  }
  return fallback;
}

export function Navigate({ to, replace = false }) {
  useEffect(() => navigate(to, replace), [to, replace]);
  return null;
}
