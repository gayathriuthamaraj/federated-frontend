import Link from "next/link";

type NavItemProps = {
  label: string;
  href: string;
  expanded: boolean;
  active: boolean;
  variant?: "default" | "post";
  children: React.ReactNode;
};

export function NavItem({
  label,
  href,
  expanded,
  active,
  variant = "default",
  children,
}: NavItemProps) {
  const base =
    "relative flex items-center h-10 w-full px-3 gap-3 rounded-md group cursor-pointer transition-all duration-200 overflow-hidden";

  const defaultStyle = active
    ? `
        text-bat-yellow
        bg-bat-yellow/15
        border-l-2 border-bat-yellow
        shadow-[0_0_10px_rgba(245,197,24,0.25)]
      `
    : `
        text-bat-gray
        hover:text-bat-yellow
        hover:bg-bat-yellow/10
        border-l-2 border-transparent
      `;

  const postStyle = `
    text-bat-blue
    hover:text-white
    bg-transparent
    hover:bg-bat-blue/10
    border border-bat-blue/30
    shadow-[0_0_10px_rgba(47,128,237,0.15)]
    `;


  return (
    <Link href={href} className={`${base} ${variant === "post" ? postStyle : defaultStyle}`}>
      {/* Ripple / glow layer on hover (default only) */}
      {variant === "default" && !active && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-bat-yellow/5 pointer-events-none"
        />
      )}

      {/* Icon wrapper */}
      <div
        className={`
            relative z-10 transition-transform duration-200
            ${variant === "post"
            ? "scale-110"
            : active
              ? "scale-105"
              : "group-hover:scale-110"}
        `}
      >
        {children}
      </div>

      {/* Label */}
      <span
        className={`
          relative z-10 text-sm tracking-wide whitespace-nowrap
          transition-all duration-300
          ${expanded
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2 pointer-events-none"
          }
        `}
      >
        {label}
      </span>
    </Link>
  );
}
