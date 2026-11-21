import Link from "next/link";

export function CatalystMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 19a9 9 0 0 1 9-9h7v7a9 9 0 0 1-9 9H3z" fill="currentColor" />
      <path d="M17 3h12v5a8 8 0 0 1-8 8h-4z" fill="#94A681" />
      <path
        d="m10 19 12-9"
        stroke="#FCFBF7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({
  href = "#",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      className={`brand ${className}`}
      href={href}
      aria-label="Catalyst home"
    >
      <CatalystMark />
      <span>Catalyst</span>
    </Link>
  );
}
