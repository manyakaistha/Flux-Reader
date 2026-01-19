/**
 * ReaderTopBar
 * Auto-hiding translucent top bar with back button, title, RSVP button, and menu
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { animations, dimensions, themes, typography } from '@/src/constants/readerTheme';

interface ReaderTopBarProps {
    visible: boolean;
    title: string;
    onBack: () => void;
    onRSVPTap: () => void;
    onRSVPLongPress: () => void;
    onMenuPress: () => void;
    theme?: 'light' | 'dark' | 'sepia';
}

export const ReaderTopBar: React.FC<ReaderTopBarProps> = ({
    visible,
    title,
    onBack,
    onRSVPTap,
    onRSVPLongPress,
    onMenuPress,
    theme = 'dark',
}) => {
    const translateY = useRef(new Animated.Value(visible ? 0 : -dimensions.topBarHeight - 20)).current;
    const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

    // Long press state
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const glowAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Animate visibility
    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: visible ? 0 : -dimensions.topBarHeight - 20,
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

    // Reset press state - defined first to avoid reference issues
    const resetPressState = useCallback(() => {
        longPressTimer.current = null;
        warningTimer.current = null;

        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: false,
            }),
        ]).start();
    }, [scaleAnim, glowAnim]);

    // RSVP button press handlers
    const handlePressIn = useCallback(() => {
        // Start scale animation
        Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
        }).start();

        // Start glow animation
        Animated.timing(glowAnim, {
            toValue: 1,
            duration: animations.longPressThreshold,
            useNativeDriver: false,
        }).start();

        // Warning haptic at 300ms
        warningTimer.current = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, animations.longPressWarning);

        // Long press activation at 500ms
        longPressTimer.current = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            // Scale pop effect
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            onRSVPLongPress();
            resetPressState();
        }, animations.longPressThreshold);
    }, [onRSVPLongPress, scaleAnim, glowAnim, resetPressState]);

    const handlePressOut = useCallback(() => {
        if (longPressTimer.current) {
            // Released before long press - treat as tap
            clearTimeout(longPressTimer.current);
            if (warningTimer.current) {
                clearTimeout(warningTimer.current);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRSVPTap();
        }
        resetPressState();
    }, [onRSVPTap, resetPressState]);

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
    });

    const BarContent = (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            {/* Back Button */}
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Back to library"
            >
                <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.titleContainer}>
                <Text
                    style={[styles.title, { color: colors.primaryText }]}
                    numberOfLines={1}
                    accessibilityRole="header"
                >
                    {title}
                </Text>
            </View>

            {/* RSVP Button */}
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityLabel="Activate speed reading mode. Long-press to start immediately."
            >
                <Animated.View
                    style={[
                        styles.rsvpButton,
                        { backgroundColor: colors.accent },
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Glow overlay */}
                    <Animated.View
                        style={[
                            styles.rsvpGlow,
                            { opacity: glowOpacity },
                        ]}
                    />
                    <Ionicons name="flash" size={16} color="#FFFFFF" />
                    <Text style={styles.rsvpText}>RSVP</Text>
                </Animated.View>
            </Pressable>

            {/* Menu Button */}
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onMenuPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Reading options"
            >
                <Ionicons name="ellipsis-vertical" size={24} color={colors.primaryText} />
            </TouchableOpacity>
        </Animated.View>
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
                <BlurView intensity={dimensions.blur} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.blur}>
                    <View style={[styles.innerContainer, { borderBottomColor: colors.divider }]}>
                        {/* Back Button */}
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onBack}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel="Back to library"
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
                        </TouchableOpacity>

                        {/* Title */}
                        <View style={styles.titleContainer}>
                            <Text
                                style={[styles.title, { color: colors.primaryText }]}
                                numberOfLines={1}
                                accessibilityRole="header"
                            >
                                {title}
                            </Text>
                        </View>

                        {/* RSVP Button */}
                        <Pressable
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                            accessibilityLabel="Activate speed reading mode. Long-press to start immediately."
                        >
                            <Animated.View
                                style={[
                                    styles.rsvpButton,
                                    { backgroundColor: colors.accent },
                                    { transform: [{ scale: scaleAnim }] },
                                ]}
                            >
                                <Animated.View
                                    style={[
                                        styles.rsvpGlow,
                                        { opacity: glowOpacity },
                                    ]}
                                />
                                <Ionicons name="flash" size={16} color="#FFFFFF" />
                                <Text style={styles.rsvpText}>RSVP</Text>
                            </Animated.View>
                        </Pressable>

                        {/* Menu Button */}
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onMenuPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel="Reading options"
                        >
                            <Ionicons name="ellipsis-vertical" size={24} color={colors.primaryText} />
                        </TouchableOpacity>
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
                styles.androidBar,
                { backgroundColor: colors.surface + 'F2' }, // 95% opacity
                { borderBottomColor: colors.divider },
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            {/* Back Button */}
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Back to library"
            >
                <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.titleContainer}>
                <Text
                    style={[styles.title, { color: colors.primaryText }]}
                    numberOfLines={1}
                    accessibilityRole="header"
                >
                    {title}
                </Text>
            </View>

            {/* RSVP Button */}
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityLabel="Activate speed reading mode. Long-press to start immediately."
            >
                <Animated.View
                    style={[
                        styles.rsvpButton,
                        { backgroundColor: colors.accent },
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.rsvpGlow,
                            { opacity: glowOpacity },
                        ]}
                    />
                    <Ionicons name="flash" size={16} color="#FFFFFF" />
                    <Text style={styles.rsvpText}>RSVP</Text>
                </Animated.View>
            </Pressable>

            {/* Menu Button */}
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onMenuPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Reading options"
            >
                <Ionicons name="ellipsis-vertical" size={24} color={colors.primaryText} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    blurContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    blur: {
        overflow: 'hidden',
    },
    innerContainer: {
        height: dimensions.topBarHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: dimensions.topBarHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        zIndex: 100,
    },
    androidBar: {
        borderBottomWidth: 1,
        elevation: 4,
    },
    iconButton: {
        width: dimensions.touchTarget,
        height: dimensions.touchTarget,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        paddingHorizontal: 8,
    },
    title: {
        fontFamily: typography.titleFont,
        fontSize: typography.sizes.documentTitle,
    },
    rsvpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        height: dimensions.rsvpButtonHeight,
        paddingHorizontal: 16,
        borderRadius: dimensions.cornerRadius.pill,
        gap: 6,
        overflow: 'hidden',
    },
    rsvpGlow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        borderRadius: dimensions.cornerRadius.pill,
    },
    rsvpText: {
        fontFamily: typography.uiFontBold,
        fontSize: typography.sizes.rsvpButton,
        color: '#FFFFFF',
    },
});

export default ReaderTopBar;
