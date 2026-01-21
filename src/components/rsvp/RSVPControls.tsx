import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getSetting, setSetting } from '../../database/db';

// WPM step size
const WPM_STEP = 50;
const MIN_WPM = 100;
const MAX_WPM = 1500;
const WPM_SETTING_KEY = 'rsvp_target_wpm';

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
 * RSVP Controls Component
 * Play/pause, skip, and speed controls
 * WPM is shown as a capsule above the play button
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

    // Load saved WPM on mount
    useEffect(() => {
        const loadSavedWPM = async () => {
            try {
                const savedWPM = await getSetting(WPM_SETTING_KEY);
                if (savedWPM) {
                    const parsedWPM = parseInt(savedWPM, 10);
                    if (!isNaN(parsedWPM) && parsedWPM >= MIN_WPM && parsedWPM <= MAX_WPM) {
                        onWPMChange(parsedWPM);
                    }
                }
            } catch (error) {
                console.error('Failed to load saved WPM:', error);
            }
        };
        loadSavedWPM();
    }, []); // Only run on mount

    // Save WPM when it changes
    const saveWPM = useCallback(async (wpm: number) => {
        try {
            await setSetting(WPM_SETTING_KEY, wpm.toString());
        } catch (error) {
            console.error('Failed to save WPM:', error);
        }
    }, []);

    const handleSpeedUp = useCallback(() => {
        const newWPM = Math.min(targetWPM + WPM_STEP, MAX_WPM);
        Haptics.selectionAsync();
        onWPMChange(newWPM);
        saveWPM(newWPM);
    }, [targetWPM, onWPMChange, saveWPM]);

    const handleSpeedDown = useCallback(() => {
        const newWPM = Math.max(targetWPM - WPM_STEP, MIN_WPM);
        Haptics.selectionAsync();
        onWPMChange(newWPM);
        saveWPM(newWPM);
    }, [targetWPM, onWPMChange, saveWPM]);

    const handleSpeedLongPressIn = useCallback((direction: 'up' | 'down') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        longPressTimer.current = setInterval(() => {
            if (direction === 'up') {
                handleSpeedUp();
            } else {
                handleSpeedDown();
            }
        }, 120);
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
            {/* WPM Capsule - Above play button */}
            <View style={styles.wpmCapsule}>
                {/* Minus button */}
                <TouchableOpacity
                    style={styles.wpmButton}
                    onPress={handleSpeedDown}
                    onLongPress={() => handleSpeedLongPressIn('down')}
                    onPressOut={handleSpeedLongPressOut}
                    delayLongPress={300}
                    activeOpacity={0.7}
                    disabled={targetWPM <= MIN_WPM}
                >
                    <Ionicons
                        name="remove"
                        size={20}
                        color={targetWPM <= MIN_WPM ? COLORS.textTertiary : COLORS.textPrimary}
                    />
                </TouchableOpacity>

                {/* WPM Display */}
                <View style={styles.wpmDisplay}>
                    <Text style={styles.wpmValue}>{targetWPM}</Text>
                    <Text style={styles.wpmLabel}>WPM</Text>
                </View>

                {/* Plus button */}
                <TouchableOpacity
                    style={styles.wpmButton}
                    onPress={handleSpeedUp}
                    onLongPress={() => handleSpeedLongPressIn('up')}
                    onPressOut={handleSpeedLongPressOut}
                    delayLongPress={300}
                    activeOpacity={0.7}
                    disabled={targetWPM >= MAX_WPM}
                >
                    <Ionicons
                        name="add"
                        size={20}
                        color={targetWPM >= MAX_WPM ? COLORS.textTertiary : COLORS.textPrimary}
                    />
                </TouchableOpacity>
            </View>

            {/* Playback Controls Row */}
            <View style={styles.playbackRow}>
                {/* Skip Backward */}
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkipBackward}
                    activeOpacity={0.7}
                >
                    <Ionicons name="play-back" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>

                {/* Play/Pause */}
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
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkipForward}
                    activeOpacity={0.7}
                >
                    <Ionicons name="play-forward" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32, // Extra padding to avoid home indicator
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    wpmCapsule: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.controlBg,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
        overflow: 'hidden',
    },
    wpmButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wpmDisplay: {
        flexDirection: 'row',
        alignItems: 'center', // Changed from baseline to center for vertical alignment
        paddingHorizontal: 12,
        gap: 6,
    },
    wpmValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: COLORS.accent,
    },
    wpmLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: COLORS.textTertiary,
        letterSpacing: 0.5,
    },
    playbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
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
});

export default RSVPControls;
