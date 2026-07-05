import React from "react";

const brandBase = `${import.meta.env.BASE_URL}brand/logo/`;

const logoMap = {
  full: `${brandBase}logo-full.svg`,
  horizontal: `${brandBase}logo-horizontal.svg`,
  icon: `${brandBase}logo-icon.svg`,
  monochrome: `${brandBase}logo-monochrome.svg`,
};

const sizeMap = {
  sm: 48,
  md: 72,
  lg: 160,
  xl: 180,
};

export default function BrandLogo({
  variant = "horizontal",
  size = "md",
  className = "",
  alt = "Jannati AI Tutor",
  light = false,
  dark = false,
  horizontal = false,
  iconOnly = false,
  full = false,
}) {
  const resolvedVariant = iconOnly
    ? "icon"
    : full
      ? "full"
      : horizontal
        ? "horizontal"
        : light || dark
          ? "monochrome"
          : variant;
  const src = logoMap[resolvedVariant] || logoMap.horizontal;
  const resolvedSize = typeof size === "number" ? size : sizeMap[size] || sizeMap.md;

  return (
    <img
      src={src}
      alt={alt}
      className={`brand-logo brand-logo-${resolvedVariant} ${className}`}
      style={{
        width: resolvedVariant === "icon" ? resolvedSize : "auto",
        maxWidth: "100%",
        height: resolvedSize,
        maxHeight: resolvedSize,
        display: "block",
        objectFit: "contain",
      }}
      loading="eager"
      decoding="async"
    />
  );
}
