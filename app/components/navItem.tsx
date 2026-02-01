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
    "relative flex items-center h-10 w-full px-3 gap-3 rounded-md group cursor-pointer transition-all duration-200";

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
      {/* Icon */}
      <div
        className={`
            transition-all duration-200
            ${variant === "post"
            ? "scale-110"
            : active
              ? "scale-105"
              : "group-hover:scale-105"}
        `}
      >
        {children}
      </div>

      {/* Label */}
      <span
        className={`
          text-sm tracking-wide whitespace-nowrap
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
