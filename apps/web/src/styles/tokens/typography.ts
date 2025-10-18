// Typography tokens mapped to CSS variables
export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
    '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
    '4xl': 'var(--text-4xl)',
  },
  leading: {
    xs: 'var(--leading-xs)',
    sm: 'var(--leading-sm)',
    base: 'var(--leading-base)',
    lg: 'var(--leading-lg)',
    xl: 'var(--leading-xl)',
    '2xl': 'var(--leading-2xl)',
    '3xl': 'var(--leading-3xl)',
    '4xl': 'var(--leading-4xl)',
  },
  weight: {
    regular: 'var(--font-weight-regular)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
  },
} as const;
