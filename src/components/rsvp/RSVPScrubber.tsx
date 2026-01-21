import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_HORIZONTAL_PADDING = 24;
const BAR_WIDTH = SCREEN_WIDTH - BAR_HORIZONTAL_PADDING * 2;

interface RSVPScrubberProps {
    currentIndex: number;
    totalTokens: number;
    currentPage: number;
    totalPages: number;
    onSeek: (tokenIndex: number) => void;
}

// Design system colors
const COLORS = {
    background: '#0a0a14',
    surface: '#1a1a2e',
    accent: '#4ECDC4',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    barBackground: '#1a1a2e',
    barFill: '#4ECDC4',
    handle: '#4ECDC4',
};

/**
 * RSVP Scrubber Component
 * Interactive progress bar with page markers
 */
export function RSVPScrubber({
    currentIndex,
    totalTokens,
    currentPage,
    totalPages,
    onSeek,
}: RSVPScrubberProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragProgress, setDragProgress] = useState(0);
    const handleScale = useRef(new Animated.Value(1)).current;
    const barHeight = useRef(new Animated.Value(6)).current;
    const lastHapticIndex = useRef(0);

    // Current progress (0-1)
    const progress = totalTokens > 0 ? currentIndex / totalTokens : 0;
    const displayProgress = isDragging ? dragProgress : progress;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: (evt) => {
                setIsDragging(true);

                // Animate handle and bar expansion
                Animated.parallel([
                    Animated.spring(handleScale, {
                        toValue: 1.4,
                        useNativeDriver: true,
                    }),
                    Animated.spring(barHeight, {
                        toValue: 12,
                        useNativeDriver: false,
                    }),
                ]).start();

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                // Calculate initial position
                const x = evt.nativeEvent.locationX;
                const newProgress = Math.max(0, Math.min(1, x / BAR_WIDTH));
                setDragProgress(newProgress);
            },

            onPanResponderMove: (evt, gestureState) => {
                const x = gestureState.moveX - BAR_HORIZONTAL_PADDING;
                const newProgress = Math.max(0, Math.min(1, x / BAR_WIDTH));
                setDragProgress(newProgress);

                // Calculate word index for haptic feedback
                const wordIndex = Math.floor(newProgress * totalTokens);

                // Haptic feedback every 10 words
                if (Math.floor(wordIndex / 10) !== Math.floor(lastHapticIndex.current / 10)) {
                    Haptics.selectionAsync();
                    lastHapticIndex.current = wordIndex;
                }
            },

            onPanResponderRelease: () => {
                setIsDragging(false);

                // Animate handle and bar back
                Animated.parallel([
                    Animated.spring(handleScale, {
                        toValue: 1,
                        useNativeDriver: true,
                    }),
                    Animated.spring(barHeight, {
                        toValue: 6,
                        useNativeDriver: false,
                    }),
                ]).start();

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                // Seek to position
                const wordIndex = Math.floor(dragProgress * totalTokens);
                onSeek(wordIndex);
            },
        })
    ).current;

    // Calculate handle position
    const handlePosition = displayProgress * BAR_WIDTH;

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.barContainer} {...panResponder.panHandlers}>
                <Animated.View style={[styles.bar, { height: barHeight }]}>
                    {/* Filled portion */}
                    <View
                        style={[
                            styles.barFill,
                            { width: `${displayProgress * 100}%` }
                        ]}
                    />

                    {/* Handle */}
                    <Animated.View
                        style={[
                            styles.handle,
                            {
                                left: handlePosition - 10,
                                transform: [{ scale: handleScale }],
                            },
                        ]}
                    />
                </Animated.View>
            </View>

            {/* Page Labels */}
            <View style={styles.pageLabels}>
                <Text style={styles.pageText}>Page {currentPage}</Text>
                <Text style={styles.pageText}>of {totalPages}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: BAR_HORIZONTAL_PADDING,
        paddingVertical: 16,
    },
    barContainer: {
        height: 32,
        justifyContent: 'center',
    },
    bar: {
        width: '100%',
        backgroundColor: COLORS.barBackground,
        borderRadius: 6,
        overflow: 'visible',
    },
    barFill: {
        height: '100%',
        backgroundColor: COLORS.barFill,
        borderRadius: 6,
    },
    handle: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.handle,
        top: -7,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    pageLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    pageText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: COLORS.textSecondary,
    },
});

export default RSVPScrubber;
