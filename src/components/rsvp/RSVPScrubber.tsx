import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
 * Uses refs for callback values to avoid stale closures in PanResponder
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
    const [previewPage, setPreviewPage] = useState(currentPage);

    // Use refs to store latest values - these are updated on every render
    // so the PanResponder always has access to fresh values
    const totalTokensRef = useRef(totalTokens);
    const totalPagesRef = useRef(totalPages);
    const onSeekRef = useRef(onSeek);
    const dragProgressRef = useRef(0);
    const lastHapticRef = useRef(0);

    // Keep refs updated on every render
    useEffect(() => {
        totalTokensRef.current = totalTokens;
        totalPagesRef.current = totalPages;
        onSeekRef.current = onSeek;
    });

    // Animation values
    const handleScale = useRef(new Animated.Value(1)).current;
    const barHeight = useRef(new Animated.Value(6)).current;

    // Current progress (0-1)
    const progress = totalTokens > 0 ? currentIndex / totalTokens : 0;
    const displayProgress = isDragging ? dragProgress : progress;

    // Debug log
    console.log('[Scrubber] currentIndex:', currentIndex, 'totalTokens:', totalTokens, 'progress:', (progress * 100).toFixed(1) + '%', 'currentPage:', currentPage);

    // Calculate page from progress
    const getPageFromProgress = useCallback((prog: number): number => {
        return Math.max(1, Math.min(totalPagesRef.current, Math.ceil(prog * totalPagesRef.current)));
    }, []);

    // Create PanResponder with useMemo so it's recreated when needed
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt) => {
            setIsDragging(true);

            // Calculate initial position
            const x = evt.nativeEvent.locationX;
            const newProgress = Math.max(0, Math.min(1, x / BAR_WIDTH));
            setDragProgress(newProgress);
            dragProgressRef.current = newProgress;
            setPreviewPage(getPageFromProgress(newProgress));

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
        },

        onPanResponderMove: (evt, gestureState) => {
            const x = gestureState.moveX - BAR_HORIZONTAL_PADDING;
            const newProgress = Math.max(0, Math.min(1, x / BAR_WIDTH));
            setDragProgress(newProgress);
            dragProgressRef.current = newProgress;
            setPreviewPage(getPageFromProgress(newProgress));

            // Calculate word index for haptic feedback
            const wordIndex = Math.floor(newProgress * totalTokensRef.current);

            // Haptic feedback every 10 words
            if (Math.floor(wordIndex / 10) !== Math.floor(lastHapticRef.current / 10)) {
                Haptics.selectionAsync();
                lastHapticRef.current = wordIndex;
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

            // Seek to position using refs for fresh values
            const wordIndex = Math.floor(dragProgressRef.current * totalTokensRef.current);
            console.log('[Scrubber] Seeking to word index:', wordIndex, 'of', totalTokensRef.current);
            onSeekRef.current(wordIndex);
        },
    }), [handleScale, barHeight, getPageFromProgress]);

    // Calculate handle position
    const handlePosition = displayProgress * BAR_WIDTH;

    // Display page - use preview during drag
    const displayPage = isDragging ? previewPage : currentPage;

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

            {/* Page Labels - Centered */}
            <View style={styles.pageLabels}>
                <Text style={styles.pageText}>
                    Page {displayPage} of {totalPages}
                </Text>
            </View>

            {/* Preview text during drag */}
            {isDragging && (
                <View style={styles.previewContainer}>
                    <Text style={styles.previewText}>
                        Jump to page {previewPage}
                    </Text>
                </View>
            )}
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
        justifyContent: 'center',
        marginTop: 8,
    },
    pageText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    progressText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: COLORS.accent,
    },
    previewContainer: {
        position: 'absolute',
        top: -30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    previewText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: COLORS.accent,
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
});

export default RSVPScrubber;
