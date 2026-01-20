import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReaderFooterProps {
    currentPage: number;
    totalPages: number;
    visible: boolean;
}

export function ReaderFooter({
    currentPage,
    totalPages,
    visible,
}: ReaderFooterProps) {
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

    // Estimate reading time (assuming ~2 min per page)
    const pagesRemaining = totalPages - currentPage;
    const minutesRemaining = Math.round(pagesRemaining * 2);
    const timeText = minutesRemaining > 60
        ? `~${Math.round(minutesRemaining / 60)} hr left`
        : `~${minutesRemaining} min left`;

    return (
        <Animated.View
            entering={SlideInDown.duration(250)}
            exiting={SlideOutDown.duration(250)}
            style={[styles.container, { paddingBottom: insets.bottom || 8 }]}
        >
            {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
                <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
            )}

            <View style={styles.content}>
                <Text style={styles.progressText}>
                    Page {currentPage} of {totalPages} • <Text style={styles.accent}>{progress}%</Text> • {timeText}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    androidBackground: {
        backgroundColor: 'rgba(10, 10, 20, 0.95)',
    },
    content: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    progressText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#B0B0B0',
    },
    accent: {
        color: '#4ECDC4',
    },
});
