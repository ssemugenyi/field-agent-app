export const palette = {
  red500: '#FB2C36',

  orange50: '#FFF7ED',
  orange100: '#FFEDD4',
  orange300: '#FFB86A',
  orange500: '#FF6900',
  orange600: '#F54900',
  orange900: '#7E2A0C',

  amber50: '#FFFBEB',
  amber600: '#E17100',

  yellow200: '#FFF085',
  yellow400: '#FDC700',
  yellow800: '#894B00',

  green300: '#7BF1A8',
  green400: '#05DF72',
  green600: '#00A63E',
  green800: '#016630',

  cyan300: '#53EAFD',
  cyan400: '#00D3F2',

  blue100: '#DBEAFE',
  blue400: '#51A2FF',
  blue500: '#2B7FFF',
  blue600: '#155DFC',

  indigo100: '#E0E7FF',
  violet300: '#C4B4FF',
  purple500: '#AD46FF',
  pink300: '#FDA5D5',
  pink500: '#F6339A',
  rose50: '#FFF1F2',

  slate200: '#E2E8F0',
  slate300: '#CAD5E2',
  slate400: '#90A1B9',
  slate600: '#45556C',
  slate700: '#314158',
  slate800: '#1D293D',

  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DC',
  gray500: '#6A7282',
  gray600: '#4A5565',
  gray700: '#364153',
  gray800: '#1E2939',
  gray900: '#101828',

  neutral700: '#404040',

  black: '#000000',
  white: '#FFFFFF',
} as const;

export const brand = {
  navyBlue: '#04243B',
  charcoalBlack: '#161B22',
  vividOrange: '#FF9C1D',
  orangeDark: '#CA7A00',
  slateGray: '#6D6D6D',
  gunmetal: '#02314D',
  white400: 'rgba(255, 255, 255, 0.8)',
  calloutGreenBg: 'rgba(43, 110, 98, 0.2)',
  lightGray: '#DADADA',
  darkGray: '#6D6D6D',
  errorRed: '#E0002C',
  warningYellow: '#FBBC05',
  successGreen: '#34A853',
} as const;

export const colors = {
  primary: brand.vividOrange,
  primaryDark: brand.orangeDark,
  primaryMuted: palette.orange50,
  primarySoft: palette.orange100,

  secondary: brand.navyBlue,
  secondaryMuted: brand.gunmetal,
  secondarySoft: palette.slate200,

  background: palette.gray100,
  surface: palette.white,
  surfaceDark: brand.charcoalBlack,

  border: brand.lightGray,
  borderMuted: palette.gray200,

  text: palette.gray900,
  textMuted: brand.slateGray,
  textInverse: palette.white,

  success: '#15803D',
  successBg: '#DCFCE7',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  error: brand.errorRed,
  errorBg: palette.rose50,
  info: palette.blue600,
  infoBg: palette.blue100,

  overlay: 'rgba(2, 6, 23, 0.5)',
} as const;

export type ColorToken = keyof typeof colors;
