import Link from "next/link";

export function AppHeader({ backHref, label = "홈으로" }: { backHref?: string; label?: string }) {
  return (
    <header className="mb-9 flex items-center justify-between gap-4">
      <Link className="pixel-button ghost !min-h-11 !px-4 !py-2 text-sm" href={backHref ?? "/"}>
        {backHref ? "←" : "⌂"} {label}
      </Link>
      <div className="text-right">
        <p className="eyebrow">Turtle Soup AI</p>
        <p className="text-sm font-bold text-white">심해 추리 통신</p>
      </div>
    </header>
  );
}
