/** Small inline icon set (20×20 grid, stroke-based) so the UI doesn't depend on emoji rendering. */
const PATHS = {
  check: <path d="M4.5 10.5l3.5 3.5 7.5-8" />,
  x: <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />,
  alert: (
    <>
      <path d="M10 3.4l7.4 12.9H2.6z" />
      <path d="M10 8.4v3.4M10 14.2v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 9.2v4.3M10 6.7v.1" />
    </>
  ),
  block: (
    <>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M5 5l10 10" />
    </>
  ),
  star: <path d="M10 2.9l2.1 4.4 4.8.6-3.5 3.3.9 4.8L10 13.6l-4.3 2.4.9-4.8-3.5-3.3 4.8-.6z" />,
  back: <path d="M16 10H4.5M9.5 5l-5 5 5 5" />,
  pin: (
    <>
      <path d="M10 17.5s5.8-4.9 5.8-9.2a5.8 5.8 0 10-11.6 0c0 4.3 5.8 9.2 5.8 9.2z" />
      <circle cx="10" cy="8.3" r="2" />
    </>
  ),
  building: <path d="M4 17V4.5A1.5 1.5 0 015.5 3h5A1.5 1.5 0 0112 4.5V17M12 8.5h2.5A1.5 1.5 0 0116 10v7M2.5 17h15M7 6.5h2M7 10h2M7 13.5h2" />,
  job: <path d="M3.5 7h13a1 1 0 011 1v7a1 1 0 01-1 1h-13a1 1 0 01-1-1V8a1 1 0 011-1zM7 7V5.5A1.5 1.5 0 018.5 4h3A1.5 1.5 0 0113 5.5V7" />,
  cap: <path d="M10 4L2 8l8 4 8-4-8-4zM5 10.2v3.3c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-3.3" />,
  search: <path d="M9 14.5a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 13l4 4" />,
  plus: <path d="M10 4.5v11M4.5 10h11" />,
  note: <path d="M5 3.5h10a1 1 0 011 1V13l-3.5 3.5H5a1 1 0 01-1-1v-10a1 1 0 011-1zM12.5 16.5v-3H16M7 7.5h6M7 10.5h3" />,
  globe: (
    <>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M2.8 10h14.4M10 2.8c2 2 3 4.4 3 7.2s-1 5.2-3 7.2c-2-2-3-4.4-3-7.2s1-5.2 3-7.2z" />
    </>
  ),
};

export default function Icon({ name, size = 16, filled = false, className = '' }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
