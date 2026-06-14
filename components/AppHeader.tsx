import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export function AppHeader({
  backHref,
  label,
}: {
  backHref?: string;
  label?: string;
}) {
  return (
    <header className="mb-4 flex items-center justify-between gap-4">
      <Link
        className="pixel-button ghost flex min-h-11! items-center justify-center gap-2 px-4! py-2! text-sm"
        href={backHref ?? "/"}
      >
        {backHref ? (
          <ArrowLeft aria-hidden="true" size={18} />
        ) : (
          <Home aria-hidden="true" size={18} />
        )}
        {label}
      </Link>
    </header>
  );
}
