type TabProps = {
  children: React.ReactNode;
  active?: boolean;
};

export function Tab({ children, active }: TabProps) {
  return (
    <button
      className={`
        relative px-4 py-3
        text-sm font-medium
        transition-colors

        ${
          active
            ? "text-bat-yellow"
            : "text-bat-gray/60 hover:text-bat-yellow"
        }
      `}
    >
      {children}

      {}
      {active && (
        <span
          className="
            absolute left-1/2 -bottom-px
            h-0.5 w-6
            -translate-x-1/2
            rounded-full
            bg-bat-yellow
          "
        />
      )}
    </button>
  );
}
