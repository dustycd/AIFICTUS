// Typography configuration for Fictus AI - Updated for Arvo
export const typography = {
  // Font families - Arvo for all text, Inter only for numbers
  fonts: {
    primary: '"Arvo", "Georgia", "Times New Roman", serif',
    secondary: '"Arvo", "Georgia", "Times New Roman", serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    numeric: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif', // Only for numbers
  },

  // Font sizes (using rem for scalability)
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
    '8xl': '6rem',    // 96px
    '9xl': '8rem',    // 128px
  },

  // Font weights
  weights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Typography utility classes - using Arvo for all text except numbers
export const typographyClasses = {
  // Headings - using Arvo
  h1: `font-bold text-6xl sm:text-7xl lg:text-8xl tracking-tight leading-none`,
  h2: `font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight`,
  h3: `font-semibold text-xl leading-snug`,
  h4: `font-semibold text-lg leading-snug`,
  h5: `font-medium text-base leading-normal`,
  h6: `font-medium text-sm leading-normal`,

  // Body text - using Arvo
  body: `font-normal text-base leading-relaxed`,
  bodySmall: `font-normal text-sm leading-normal`,
  bodyLarge: `font-normal text-lg leading-relaxed`,

  // Special text styles - using Arvo
  caption: `font-normal text-xs leading-normal`,
  overline: `font-medium text-xs uppercase tracking-wider leading-normal`,
  subtitle1: `font-normal text-base leading-relaxed`,
  subtitle2: `font-medium text-sm leading-normal`,

  // Button text - using Arvo
  button: `font-bold text-base leading-none`,
  buttonSmall: `font-bold text-sm leading-none`,
  buttonLarge: `font-bold text-lg leading-none`,

  // Navigation - using Arvo
  navLink: `font-medium text-base leading-none`,
  navLinkMobile: `font-medium text-lg leading-none`,

  // Hero section - using Arvo
  heroTitle: `font-bold text-6xl sm:text-7xl lg:text-8xl tracking-tight leading-none`,
  heroSubtitle: `font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight`,
  heroCaption: `font-normal text-sm sm:text-base leading-normal`,

  // Card elements - using Arvo
  cardTitle: `font-semibold text-base leading-snug`,
  cardSubtitle: `font-normal text-sm leading-normal`,
  cardCaption: `font-normal text-xs leading-normal`,

  // Tags and labels - using Arvo
  tag: `font-medium text-xs leading-none`,
  label: `font-medium text-sm leading-normal`,
  
  // Special effects - using Arvo
  neonText: `font-bold tracking-tight`,
  gradientText: `font-bold bg-clip-text text-transparent`,
  
  // Metrics and numbers - ONLY these use Inter for reliability
  metric: `font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none numeric-text`,
  metricLarge: `font-bold text-6xl sm:text-7xl lg:text-8xl tracking-tight leading-none numeric-text`,
} as const;

// Color combinations for text
export const textColors = {
  primary: 'text-white',
  secondary: 'text-gray-300',
  muted: 'text-gray-400',
  accent: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  
  // Gradient text
  gradient: 'bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600',
  gradientAlt: 'bg-gradient-to-r from-cyan-400 to-blue-500',
} as const;

// Responsive typography utilities
export const responsiveText = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  base: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
  xl: 'text-xl sm:text-2xl',
  '2xl': 'text-2xl sm:text-3xl',
  '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
  '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
  hero: 'text-6xl sm:text-7xl lg:text-8xl',
} as const;