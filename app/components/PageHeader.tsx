"use client";

import Link from "next/link";
import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  prevHref?: string;
  nextHref?: string;
  prevLabel?: React.ReactNode;
  nextLabel?: React.ReactNode;
  transparent?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  prevHref,
  nextHref,
  prevLabel = (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M11 4.5L6.5 9L11 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  nextLabel = (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 4.5L11.5 9L7 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
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
            className="nav-btn"
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
              boxShadow: "var(--shadow-button)",
              transition: "box-shadow 0.2s ease",
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
            className="nav-btn"
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
              boxShadow: "var(--shadow-button)",
              transition: "box-shadow 0.2s ease",
            }}
          >
            {nextLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
