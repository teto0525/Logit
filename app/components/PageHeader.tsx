"use client";

import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  prevHref?: string;
  nextHref?: string;
  prevLabel?: string;
  nextLabel?: string;
  transparent?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  prevHref,
  nextHref,
  prevLabel = "‹",
  nextLabel = "›",
  transparent = false,
}: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 24px 20px",
        background: transparent ? "transparent" : "var(--color-background)",
        borderBottom: "none",
      }}
    >
      <div style={{ width: 48, textAlign: "left" }}>
        {prevHref && (
          <Link
            href={prevHref}
            style={{
              color: "var(--color-body)",
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 500,
              width: 44,
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              background: "transparent",
              border: "1px solid var(--color-border)",
              transition: "background 0.2s ease",
            }}
          >
            {prevLabel}
          </Link>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.5px",
            color: "var(--color-ink)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-accent-text)",
              margin: "4px 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ width: 48, textAlign: "right" }}>
        {nextHref && (
          <Link
            href={nextHref}
            style={{
              color: "var(--color-body)",
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 500,
              width: 44,
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              background: "transparent",
              border: "1px solid var(--color-border)",
              transition: "background 0.2s ease",
            }}
          >
            {nextLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
