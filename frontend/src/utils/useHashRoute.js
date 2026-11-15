import { useEffect, useState } from 'react';

/** Tiny hash router: "#/matches", "#/shortlist", "#/opportunity/opp-001", default "#/profile". */
function parse() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'profile', param: parts[1] ? decodeURIComponent(parts[1]) : null };
}

export function useHashRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const go = (path) => {
  window.location.hash = path;
};
