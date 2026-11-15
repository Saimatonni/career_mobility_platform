import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api.js';
import { go, useHashRoute } from './utils/useHashRoute.js';
import ProfilePage from './pages/ProfilePage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import ShortlistPage from './pages/ShortlistPage.jsx';
import Banner from './components/Banner.jsx';

// Only an opaque profile id is kept in the browser; no personal data is stored client-side.
const KEY = 'cmp.profileId';
const readId = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const writeId = (id) => {
  try {
    id ? localStorage.setItem(KEY, id) : localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable (private mode); the session still works */
  }
};

export default function App() {
  const route = useHashRoute();
  const [meta, setMeta] = useState(null);
  const [profileId, setProfileId] = useState(readId);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState(null);

  const boot = useCallback(async () => {
    setFatal(null);
    setReady(false);
    try {
      setMeta(await api.meta());
      const id = readId();
      if (id) {
        try {
          setProfile(await api.getProfile(id));
          setProfileId(id);
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) {
            writeId(null); // stale id (e.g. server restarted in memory mode)
            setProfileId(null);
          } else throw e;
        }
      }
    } catch (e) {
      setFatal(e.message);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  const onSaved = (saved) => {
    writeId(saved.id);
    setProfileId(saved.id);
    setProfile(saved);
    go('/matches');
  };

  const needsProfile = !profileId && route.name !== 'profile';
  useEffect(() => {
    if (ready && needsProfile) go('/profile');
  }, [ready, needsProfile]);

  const nav = (name, label) => (
    <a href={`#/${name}`} className={route.name === name || (name === 'matches' && route.name === 'opportunity') ? 'active' : ''} aria-current={route.name === name ? 'page' : undefined}>
      {label}
    </a>
  );

  let body;
  if (!ready) body = <div className="page"><p className="loading">Loading…</p></div>;
  else if (fatal)
    body = (
      <div className="page">
        <Banner kind="error">{fatal}</Banner>
        <button type="button" className="btn btn-primary" onClick={boot}>Retry</button>
      </div>
    );
  else if (route.name === 'profile') body = <ProfilePage meta={meta} profile={profile} profileId={profileId} onSaved={onSaved} />;
  else if (!profileId) body = null;
  else if (route.name === 'matches') body = <MatchesPage profileId={profileId} />;
  else if (route.name === 'opportunity' && route.param) body = <DetailPage key={route.param} profileId={profileId} oppId={route.param} />;
  else if (route.name === 'shortlist') body = <ShortlistPage profileId={profileId} />;
  else body = <div className="page"><Banner kind="error">Page not found.</Banner><button type="button" className="btn btn-secondary" onClick={() => go('/matches')}>Go to matches</button></div>;

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/profile">
            <svg className="brand-mark" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <rect className="brand-mark-bg" x="0.75" y="0.75" width="30.5" height="30.5" rx="8.25" />
              <path className="brand-mark-path" d="M9 22C11 11 20 9 23.5 12" />
              <circle className="brand-mark-from" cx="9" cy="22" r="2.6" />
              <circle className="brand-mark-to" cx="23.5" cy="12" r="2.6" />
            </svg>
            <span>Career Mobility</span>
          </a>
          <nav aria-label="Main">
            {nav('profile', 'Profile')}
            {profileId && nav('matches', 'Matches')}
            {profileId && nav('shortlist', 'Shortlist')}
          </nav>
        </div>
      </header>
      {meta?.storage === 'memory' && (
        <div className="storage-note">Demo mode: running with an in-memory database. Data resets when the server restarts.</div>
      )}
      <main id="main">{body}</main>
      <footer className="footer">Prototype with fictional data only. Match scores are rule-based guidance, not legal or immigration advice.</footer>
    </>
  );
}
