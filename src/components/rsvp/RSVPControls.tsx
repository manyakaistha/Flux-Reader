import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RSVPControlsProps {
    currentWPM: number;
    targetWPM: number;
    progress: number;
    timeRemaining: string;
    isPlaying: boolean;
    commaPauseMs: number;
    periodPauseMs: number;
    onPlayPause: () => void;
    onWPMChange: (wpm: number) => void;
    onCommaPauseChange: (ms: number) => void;
    onPeriodPauseChange: (ms: number) => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    onClose: () => void;
}

/**
 * RSVP Controls Component
 * Provides playback controls, speed adjustment, and progress display
 */
export function RSVPControls({
    currentWPM,
    targetWPM,
    progress,
    timeRemaining,
    isPlaying,
    commaPauseMs,
    periodPauseMs,
    onPlayPause,
    onWPMChange,
    onCommaPauseChange,
    onPeriodPauseChange,
    onSkipForward,
    onSkipBackward,
    onClose,
}: RSVPControlsProps) {
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>

            {/* Playback Controls */}
            <View style={styles.controlsRow}>
                {/* Skip Backward */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={onSkipBackward}
                    activeOpacity={0.7}
                >
                    <Ionicons name="play-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Play/Pause */}
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={onPlayPause}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={32}
                        color="#000"
                    />
                </TouchableOpacity>

                {/* Skip Forward */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={onSkipForward}
                    activeOpacity={0.7}
                >
                    <Ionicons name="play-forward" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Speed Control */}
            <View style={styles.speedContainer}>
                <Text style={styles.speedLabel}>Speed</Text>
                <View style={styles.sliderContainer}>
                    <TouchableOpacity
                        style={styles.speedButton}
                        onPress={() => onWPMChange(Math.max(100, targetWPM - 50))}
                    >
                        <Ionicons name="remove" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.speedValue}>{Math.round(currentWPM)} WPM</Text>
                    <TouchableOpacity
                        style={styles.speedButton}
                        onPress={() => onWPMChange(Math.min(800, targetWPM + 50))}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Advanced Settings Toggle */}
            <TouchableOpacity
                style={styles.advancedToggle}
                onPress={() => setShowAdvanced(!showAdvanced)}
            >
                <Text style={styles.advancedToggleText}>Pause Settings</Text>
                <Ionicons
                    name={showAdvanced ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#888"
                />
            </TouchableOpacity>

            {/* Advanced Pause Controls - Collapsible */}
            {showAdvanced && (
                <View style={styles.pauseControls}>
                    {/* Comma Pause */}
                    <View style={styles.pauseControl}>
                        <Text style={styles.pauseLabel}>Comma pause</Text>
                        <View style={styles.sliderContainer}>
                            <TouchableOpacity
                                style={styles.speedButton}
                                onPress={() => onCommaPauseChange(Math.max(0, commaPauseMs - 10))}
                            >
                                <Ionicons name="remove" size={16} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.pauseValue}>{commaPauseMs}ms</Text>
                            <TouchableOpacity
                                style={styles.speedButton}
                                onPress={() => onCommaPauseChange(Math.min(500, commaPauseMs + 10))}
                            >
                                <Ionicons name="add" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Period Pause */}
                    <View style={styles.pauseControl}>
                        <Text style={styles.pauseLabel}>Period pause</Text>
                        <View style={styles.sliderContainer}>
                            <TouchableOpacity
                                style={styles.speedButton}
                                onPress={() => onPeriodPauseChange(Math.max(0, periodPauseMs - 25))}
                            >
                                <Ionicons name="remove" size={16} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.pauseValue}>{periodPauseMs}ms</Text>
                            <TouchableOpacity
                                style={styles.speedButton}
                                onPress={() => onPeriodPauseChange(Math.min(1000, periodPauseMs + 25))}
                            >
                                <Ionicons name="add" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Time Remaining */}
            <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.timeText}>{timeRemaining} remaining</Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
            >
                <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        marginRight: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#ff4444',
        borderRadius: 2,
    },
    progressText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: '#888',
        minWidth: 40,
        textAlign: 'right',
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        gap: 20,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    speedContainer: {
        marginBottom: 16,
    },
    speedLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    speedButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    speedValue: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#fff',
        minWidth: 100,
        textAlign: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    timeText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#666',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    advancedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    advancedToggleText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#888',
    },
    pauseControls: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
        gap: 10,
    },
    pauseControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pauseLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#aaa',
        flex: 1,
    },
    pauseValue: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#fff',
        minWidth: 60,
        textAlign: 'center',
    },
});

export default RSVPControls;
