const BASE_URL = import.meta.env.BASE_URL || '/';

const LOGO_SOURCES = {
  full: 'brand/logo/logo-full.svg',
  horizontal: 'brand/logo/logo-horizontal.svg',
  icon: 'brand/logo/logo-icon.svg',
  monochrome: 'brand/logo/logo-monochrome.svg',
};

export default function BrandLogo({
  size = 'md',
  variant = 'icon',
  light = false,
  dark = false,
  horizontal = false,
  iconOnly = false,
  full = false,
  className = '',
}) {
  const resolvedVariant = full ? 'full' : iconOnly ? 'icon' : horizontal ? 'horizontal' : variant;
  const sourceVariant = light || dark ? 'monochrome' : resolvedVariant;
  const src = `${BASE_URL}${LOGO_SOURCES[sourceVariant] || LOGO_SOURCES.icon}`;
  const classes = [
    'brand-logo',
    `brand-logo-${resolvedVariant}`,
    `brand-logo-${size}`,
    light ? 'brand-logo-light' : '',
    dark ? 'brand-logo-dark' : '',
    className,
  ].filter(Boolean).join(' ');

  return <img className={classes} src={src} alt="Jannati AI Tutor" loading="eager" decoding="async" />;
}
