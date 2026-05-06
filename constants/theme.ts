/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const primaryOrangeLight = '#FF5722'; 
const primaryOrangeDark = '#FF7043';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F4F6F8',
    cardBackground: '#FFFFFF',
    tint: primaryOrangeDark,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryOrangeLight,
    success: '#28A745',
    danger: '#FF3B30',
  },
  dark: {
    text: '#ECEDEE',
    background: '#121212',
    cardBackground: '#1E1E1E',
    tint: primaryOrangeDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryOrangeDark,
    success: '#32D74B',
    danger: '#FF453A',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
