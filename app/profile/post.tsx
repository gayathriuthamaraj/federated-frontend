import Image from "next/image";

type PostProps = {
  author?: string;
  handle?: string;
  content?: string;
  time?: string;
};

export function Post({
  author = "Bruce Wayne",
  handle = "@bruce@gotham.social",
  content = "Systems don’t collapse dramatically. They erode when no one is watching.",
  time = "3h",
}: PostProps) {
  return (
    <div
      className="
        flex gap-3 py-4
        border-b border-bat-yellow/10
        hover:bg-white/2
        transition
      "
    >
      {/* Avatar */}
      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-bat-dark">
        <Image
          src="/avatar-placeholder.png"
          alt="Avatar"
          fill
          className="object-cover"
        />
      </div>

      {/* Body */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-bat-yellow">
            {author}
          </span>
          <span className="text-bat-gray/60">
            {handle}
          </span>
          <span className="text-bat-gray/40">·</span>
          <span className="text-bat-gray/40">{time}</span>
        </div>

        {/* Content */}
        <p className="mt-1 text-sm leading-relaxed text-bat-gray/95">
          {content}
        </p>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between max-w-xs text-xs text-bat-gray/50">
          <Action label="Reply" />
          <Action label="Boost" />
          <Action label="Like" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Action Button ---------- */

function Action({ label }: { label: string }) {
  return (
    <button
      className="
        flex items-center gap-1
        hover:text-bat-yellow
        transition
      "
    >
      {label}
    </button>
  );
}
