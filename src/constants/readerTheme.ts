/**
 * Reader Theme Configuration
 * Defines color palettes and typography for light, dark, and sepia modes
 */

export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'auto';

export interface ThemeColors {
    background: string;
    surface: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
    divider: string;
    highlight: string;
    highlightOpacity: number;
}

export const themes: Record<Exclude<ReaderTheme, 'auto'>, ThemeColors> = {
    light: {
        background: '#FFFFFF',
        surface: '#FAFAFA',
        primaryText: '#000000',
        secondaryText: '#616161',
        accent: '#2196F3',
        divider: '#E0E0E0',
        highlight: '#FFEB3B',
        highlightOpacity: 0.35,
    },
    dark: {
        background: '#121212',
        surface: '#1E1E1E',
        primaryText: '#FFFFFF',
        secondaryText: '#B0B0B0',
        accent: '#64B5F6',
        divider: '#373737',
        highlight: '#FFF176',
        highlightOpacity: 0.25,
    },
    sepia: {
        background: '#F4ECD8',
        surface: '#EBE0C8',
        primaryText: '#3E2723',
        secondaryText: '#6D4C41',
        accent: '#D84315',
        divider: '#D7CFC0',
        highlight: '#FFD54F',
        highlightOpacity: 0.40,
    },
};

// Typography scale
export const typography = {
    titleFont: 'InstrumentSerif_500Medium',
    uiFont: 'Inter_400Regular',
    uiFontMedium: 'Inter_500Medium',
    uiFontBold: 'Inter_700Bold',

    // Font sizes in sp
    sizes: {
        documentTitle: 18,
        rsvpButton: 14,
        menuItems: 16,
        progressText: 14,
        pageNumber: 13,
        sliderLabel: 13,
        sheetTitle: 20,
        scrollIndicator: 16,
        toastMessage: 14,
    },
};

// Spacing and dimensions
export const dimensions = {
    topBarHeight: 56,
    footerHeight: 44,
    touchTarget: 48,
    rsvpButtonHeight: 40,
    cornerRadius: {
        small: 4,
        medium: 8,
        large: 16,
        pill: 20,
    },
    blur: 20,
};

// Animation durations in ms
export const animations = {
    chromeHide: 250,
    highlightFadeIn: 300,
    highlightPersist: 3000,
    highlightFadeOut: 1000,
    scrollToHighlight: 500,
    buttonPress: 200,
    longPressThreshold: 500,
    longPressWarning: 300,
    autoHideDelay: 3000,
    scrollDebounce: 2000,
};

// Get theme based on system appearance
export const getTheme = (
    selectedTheme: ReaderTheme,
    systemIsDark: boolean
): ThemeColors => {
    if (selectedTheme === 'auto') {
        return systemIsDark ? themes.dark : themes.light;
    }
    return themes[selectedTheme];
};
