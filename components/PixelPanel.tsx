import type { ReactNode } from "react";

export function PixelPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`pixel-panel ${className}`}>
      {title ? <h2 className="panel-title">+ {title} +</h2> : null}
      {children}
    </section>
  );
}
