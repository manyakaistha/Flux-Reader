import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RSVPToken } from '../../types';

interface WordDisplayProps {
    token: RSVPToken | null;
    contextBefore?: string;
    contextAfter?: string;
    isPaused: boolean;
    baseFontSize?: number;
    minimumFontSize?: number;
    showORPGuide?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Design system colors
const COLORS = {
    background: '#0a0a14',
    orpLetter: '#FF6B6B',
    textPrimary: '#FFFFFF',
    textContext: '#6B7280',
    guideLine: 'rgba(255, 107, 107, 0.3)',
};

/**
 * Calculate ORP position - approximately 35-37% into the word
 * Ignores leading/trailing punctuation for calculation
 */
function calculateORPForDisplay(text: string): { orpIndex: number; leftPart: string; orpChar: string; rightPart: string } {
    // Match pattern: leading punct, core word, trailing punct
    const match = text.match(/^([.,;:!?—–\-"'`()\[\]{}…]*)(.+?)([.,;:!?—–\-"'`()\[\]{}…]*)$/);
    if (!match) {
        return { orpIndex: 0, leftPart: '', orpChar: text[0] || '', rightPart: text.slice(1) };
    }

    const [, leading, core, trailing] = match;

    if (core.length <= 1) {
        return {
            orpIndex: leading.length,
            leftPart: leading,
            orpChar: core,
            rightPart: trailing,
        };
    }

    // ORP at ~35% of core word for optimal recognition
    const coreORP = Math.floor(core.length * 0.35);
    return {
        orpIndex: leading.length + coreORP,
        leftPart: leading + core.slice(0, coreORP),
        orpChar: core[coreORP],
        rightPart: core.slice(coreORP + 1) + trailing,
    };
}

/**
 * RSVP Word Display Component
 * 
 * Key feature: The ORP (Optimal Recognition Point) character is displayed
 * at a FIXED position on screen. The word is positioned so that the ORP
 * character is always at the center. This allows the eye to stay fixed
 * while words flow through that point.
 */
export function WordDisplay({
    token,
    contextBefore,
    contextAfter,
    isPaused,
    baseFontSize = 48,
    minimumFontSize = 28,
    showORPGuide = false, // Guide line disabled by default
}: WordDisplayProps) {

    // Calculate font size based on word length
    const fontSize = useMemo(() => {
        if (!token) return baseFontSize;

        const maxWidth = SCREEN_WIDTH * 0.85;
        const charWidth = baseFontSize * 0.55;
        const estimatedWordWidth = token.text.length * charWidth;

        if (estimatedWordWidth <= maxWidth) {
            return baseFontSize;
        }

        const shrinkFactor = maxWidth / estimatedWordWidth;
        return Math.max(Math.floor(baseFontSize * shrinkFactor), minimumFontSize);
    }, [token, baseFontSize, minimumFontSize]);

    // Get ORP parts
    const orpParts = useMemo(() => {
        if (!token) return null;
        return calculateORPForDisplay(token.text);
    }, [token]);

    if (!token) {
        return (
            <View style={styles.container}>
                <Text style={[styles.placeholderText, { fontSize }]}>Ready</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ORP Guide Line - vertical line at center */}
            {showORPGuide && (
                <View style={styles.guideLineContainer}>
                    <View style={styles.guideLine} />
                </View>
            )}

            {/* Context Words - Before (shown when paused) */}
            {isPaused && contextBefore && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={styles.contextBefore}
                >
                    <Text style={styles.contextText} numberOfLines={2}>
                        {contextBefore}
                    </Text>
                </Animated.View>
            )}

            {/* Main Word Display - Fixed ORP Position */}
            {/* 
                The key to proper RSVP: ORP character is at a FIXED position.
                We achieve this by giving leftSegment and rightSegment fixed widths
                so the ORP character is always at the exact center of the screen.
            */}
            <View style={styles.wordContainer}>
                {/* Left segment - right-aligned, fixed width to end at center */}
                <View style={styles.leftSegment}>
                    <Text
                        style={[styles.wordText, { fontSize }]}
                        numberOfLines={1}
                    >
                        {orpParts?.leftPart}
                    </Text>
                </View>

                {/* ORP character - fixed at center, highlighted in red */}
                <View style={styles.orpCharContainer}>
                    <Text style={[styles.orpChar, { fontSize }]}>
                        {orpParts?.orpChar}
                    </Text>
                </View>

                {/* Right segment - left-aligned, fixed width to start at center */}
                <View style={styles.rightSegment}>
                    <Text
                        style={[styles.wordText, { fontSize }]}
                        numberOfLines={1}
                    >
                        {orpParts?.rightPart}
                    </Text>
                </View>
            </View>

            {/* Context Words - After (shown when paused) */}
            {isPaused && contextAfter && (
                <Animated.View
                    entering={FadeIn.duration(200).delay(50)}
                    exiting={FadeOut.duration(150)}
                    style={styles.contextAfter}
                >
                    <Text style={styles.contextText} numberOfLines={2}>
                        {contextAfter}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    guideLineContainer: {
        position: 'absolute',
        top: '30%',
        bottom: '30%',
        left: '50%',
        width: 2,
        marginLeft: -1,
    },
    guideLine: {
        flex: 1,
        width: 2,
        backgroundColor: COLORS.guideLine,
    },
    wordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // No justifyContent: 'center' - we use fixed-width segments instead
    },
    leftSegment: {
        // Right-align text so it ends at the ORP position
        alignItems: 'flex-end',
        justifyContent: 'center',
        // Fixed width = half screen minus padding, so ORP stays centered
        width: SCREEN_WIDTH / 2 - 20,
    },
    rightSegment: {
        // Left-align text so it starts at the ORP position
        alignItems: 'flex-start',
        justifyContent: 'center',
        // Fixed width = half screen minus padding
        width: SCREEN_WIDTH / 2 - 20,
    },
    wordText: {
        fontFamily: 'EBGaramond_400Regular',
        color: COLORS.textPrimary,
    },
    orpCharContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        // ORP character positioned at exact center point
    },
    orpChar: {
        fontFamily: 'EBGaramond_700Bold',
        color: COLORS.orpLetter,
    },
    placeholderText: {
        fontFamily: 'Inter_400Regular',
        color: COLORS.textContext,
    },
    contextBefore: {
        position: 'absolute',
        top: '25%',
        left: 24,
        right: 24,
        alignItems: 'center',
    },
    contextAfter: {
        position: 'absolute',
        bottom: '25%',
        left: 24,
        right: 24,
        alignItems: 'center',
    },
    contextText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: COLORS.textContext,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default WordDisplay;
