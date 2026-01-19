/**
 * ReaderFooter
 * Auto-hiding translucent footer with progress indicator
 */

import { BlurView } from 'expo-blur';
import React, { useRef } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { animations, dimensions, themes, typography } from '@/src/constants/readerTheme';

interface ReaderFooterProps {
    visible: boolean;
    currentPage: number;
    totalPages: number;
    theme?: 'light' | 'dark' | 'sepia';
}

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
    visible,
    currentPage,
    totalPages,
    theme = 'dark',
}) => {
    const translateY = useRef(new Animated.Value(visible ? 0 : dimensions.footerHeight + 20)).current;
    const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

    // Animate visibility
    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: visible ? 0 : dimensions.footerHeight + 20,
                duration: animations.chromeHide,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: visible ? 1 : 0,
                duration: animations.chromeHide,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible, translateY, opacity]);

    const colors = themes[theme];
    const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

    // Calculate estimated time remaining (rough estimate: 2 minutes per page)
    const pagesRemaining = totalPages - currentPage;
    const estimatedMinutes = Math.ceil(pagesRemaining * 2);

    const timeText = estimatedMinutes <= 0
        ? ''
        : estimatedMinutes < 60
            ? ` • ~${estimatedMinutes} min left`
            : ` • ~${Math.ceil(estimatedMinutes / 60)} hrs left`;

    const progressText = `Page ${currentPage} of ${totalPages} • ${Math.round(progress)}%${timeText}`;

    const FooterContent = (
        <>
            {/* Mini progress bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: colors.divider + '4D' }]}>
                <View
                    style={[
                        styles.progressBarFill,
                        {
                            backgroundColor: colors.accent,
                            width: `${progress}%`,
                        }
                    ]}
                />
            </View>

            {/* Progress text */}
            <Text
                style={[styles.progressText, { color: colors.secondaryText }]}
                accessibilityLabel={`Page ${currentPage} of ${totalPages}, ${Math.round(progress)}% complete, approximately ${estimatedMinutes} minutes remaining`}
            >
                {progressText}
            </Text>
        </>
    );

    // Use BlurView on iOS, fallback to semi-transparent on Android
    if (Platform.OS === 'ios') {
        return (
            <Animated.View
                style={[
                    styles.blurContainer,
                    {
                        transform: [{ translateY }],
                        opacity,
                    },
                ]}
                pointerEvents={visible ? 'auto' : 'none'}
            >
                <BlurView
                    intensity={dimensions.blur}
                    tint={theme === 'dark' ? 'dark' : 'light'}
                    style={styles.blur}
                >
                    <View style={[styles.innerContainer, { borderTopColor: colors.divider }]}>
                        {FooterContent}
                    </View>
                </BlurView>
            </Animated.View>
        );
    }

    // Android fallback
    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface + 'F2', // 95% opacity
                    borderTopColor: colors.divider,
                },
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            {FooterContent}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    blurContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    blur: {
        overflow: 'hidden',
    },
    innerContainer: {
        height: dimensions.footerHeight,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderTopWidth: 1,
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: dimensions.footerHeight,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderTopWidth: 1,
        zIndex: 100,
        elevation: 4,
    },
    progressBarContainer: {
        width: '80%',
        height: 2,
        borderRadius: 1,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 1,
    },
    progressText: {
        fontFamily: typography.uiFontMedium,
        fontSize: typography.sizes.progressText,
        textAlign: 'center',
    },
});

export default ReaderFooter;
