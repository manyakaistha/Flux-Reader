import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Speed presets as per spec
const SPEED_PRESETS = [150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000];

interface RSVPControlsProps {
    targetWPM: number;
    isPlaying: boolean;
    onPlayPause: () => void;
    onWPMChange: (wpm: number) => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
}

// Design system colors
const COLORS = {
    background: '#0a0a14',
    surface: '#1a1a2e',
    accent: '#4ECDC4',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    controlBg: '#1a1a2e',
};

/**
 * Find next speed in presets
 */
function getNextSpeed(currentWPM: number, direction: 'up' | 'down'): number {
    const currentIndex = SPEED_PRESETS.findIndex(s => s >= currentWPM);

    if (direction === 'up') {
        // If already at max or beyond, stay at max
        if (currentIndex === -1 || currentIndex >= SPEED_PRESETS.length - 1) {
            return SPEED_PRESETS[SPEED_PRESETS.length - 1];
        }
        return SPEED_PRESETS[currentIndex + 1];
    } else {
        // If at first preset or below, stay at min
        if (currentIndex <= 0) {
            return SPEED_PRESETS[0];
        }
        // If between presets, go to lower one
        if (SPEED_PRESETS[currentIndex] > currentWPM) {
            return SPEED_PRESETS[currentIndex - 1];
        }
        return SPEED_PRESETS[Math.max(0, currentIndex - 1)];
    }
}

/**
 * RSVP Controls Component
 * Play/pause, skip, and speed controls
 */
export function RSVPControls({
    targetWPM,
    isPlaying,
    onPlayPause,
    onWPMChange,
    onSkipForward,
    onSkipBackward,
}: RSVPControlsProps) {
    const longPressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleSpeedUp = useCallback(() => {
        Haptics.selectionAsync();
        onWPMChange(getNextSpeed(targetWPM, 'up'));
    }, [targetWPM, onWPMChange]);

    const handleSpeedDown = useCallback(() => {
        Haptics.selectionAsync();
        onWPMChange(getNextSpeed(targetWPM, 'down'));
    }, [targetWPM, onWPMChange]);

    const handleSpeedLongPressIn = useCallback((direction: 'up' | 'down') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        longPressTimer.current = setInterval(() => {
            const handler = direction === 'up' ? handleSpeedUp : handleSpeedDown;
            handler();
        }, 150);
    }, [handleSpeedUp, handleSpeedDown]);

    const handleSpeedLongPressOut = useCallback(() => {
        if (longPressTimer.current) {
            clearInterval(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleSkipBackward = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSkipBackward();
    }, [onSkipBackward]);

    const handleSkipForward = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSkipForward();
    }, [onSkipForward]);

    const handlePlayPause = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPlayPause();
    }, [onPlayPause]);

    return (
        <View style={styles.container}>
            {/* Left: Skip Back & Forward */}
            <View style={styles.skipControls}>
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkipBackward}
                    onLongPress={() => onSkipBackward()} // Skip 50 words
                    delayLongPress={500}
                    activeOpacity={0.7}
                >
                    <Ionicons name="play-back" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Center: Play/Pause */}
            <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
                activeOpacity={0.8}
            >
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color={COLORS.background}
                    style={isPlaying ? {} : { marginLeft: 4 }}
                />
            </TouchableOpacity>

            {/* Skip Forward */}
            <View style={styles.skipControls}>
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkipForward}
                    onLongPress={() => onSkipForward()} // Skip 50 words
                    delayLongPress={500}
                    activeOpacity={0.7}
                >
                    <Ionicons name="play-forward" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Right: Speed Control */}
            <View style={styles.speedContainer}>
                {/* Increment */}
                <TouchableOpacity
                    style={styles.speedUpButton}
                    onPress={handleSpeedUp}
                    onPressIn={() => handleSpeedLongPressIn('up')}
                    onPressOut={handleSpeedLongPressOut}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-up" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>

                {/* WPM Display */}
                <View style={styles.speedDisplay}>
                    <Text style={styles.speedValue}>{targetWPM}</Text>
                    <Text style={styles.speedLabel}>WPM</Text>
                </View>

                {/* Decrement */}
                <TouchableOpacity
                    style={styles.speedDownButton}
                    onPress={handleSpeedDown}
                    onPressIn={() => handleSpeedLongPressIn('down')}
                    onPressOut={handleSpeedLongPressOut}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-down" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    skipControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skipButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.controlBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    speedContainer: {
        alignItems: 'center',
        backgroundColor: COLORS.controlBg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    speedUpButton: {
        width: 80,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.controlBg,
    },
    speedDownButton: {
        width: 80,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.controlBg,
    },
    speedDisplay: {
        alignItems: 'center',
        paddingVertical: 4,
    },
    speedValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: COLORS.accent,
    },
    speedLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 10,
        color: COLORS.textTertiary,
        letterSpacing: 1,
    },
});

export default RSVPControls;
