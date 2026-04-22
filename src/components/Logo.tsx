export const Logo = ({ size = 32 }: { size?: number }) => (
  <span
    aria-hidden
    className="relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.9)] ring-1 ring-white/15"
    style={{ width: size, height: size }}
  >
    <svg
      viewBox="0 0 24 24"
      width={size * 0.6}
      height={size * 0.6}
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="drop-shadow"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" fill="white" stroke="none" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
      <path d="M8.5 21h7" />
    </svg>
    <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-white/5 to-white/20" />
  </span>
);
