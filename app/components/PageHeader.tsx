"use client";

import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  prevHref?: string;
  nextHref?: string;
  prevLabel?: string;
  nextLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  prevHref,
  nextHref,
  prevLabel = "‹",
  nextLabel = "›",
}: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 20px 16px",
        background: "var(--color-card)",
        borderBottom: "none",
      }}
    >
      <div style={{ width: 44, textAlign: "left" }}>
        {prevHref && (
          <Link
            href={prevHref}
            style={{
              color: "var(--color-body)",
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 500,
              width: 40,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: "var(--color-surface-strong)",
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
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.3px",
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
              color: "var(--color-muted)",
              margin: "4px 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ width: 44, textAlign: "right" }}>
        {nextHref && (
          <Link
            href={nextHref}
            style={{
              color: "var(--color-body)",
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 500,
              width: 40,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: "var(--color-surface-strong)",
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
