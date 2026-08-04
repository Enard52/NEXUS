export function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      className="brand-logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NEXUS logo"
      role="img"
    >
      <defs>
        <linearGradient id="nxlogo-client" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6f9bff" />
          <stop offset="0.55" stopColor="#5b8dff" />
          <stop offset="1" stopColor="#8b7bff" />
        </linearGradient>
        <linearGradient id="nxsheen-client" x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxlogo-client)" />
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#nxsheen-client)" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#ffffff" strokeOpacity="0.22" />
      <path
        d="M10.5 22.5V10.5L21.5 22.5V10.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
