import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RSVPHeaderProps {
    progress: number; // 0-100
    timeRemaining: string;
    onClose: () => void;
    onSettings: () => void;
}

// Design system colors
const COLORS = {
    background: '#0a0a14',
    border: 'rgba(255,255,255,0.1)',
    accent: '#4ECDC4',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
};

/**
 * RSVP Header Component
 * Displays progress, time remaining, close and settings buttons
 */
export function RSVPHeader({
    progress,
    timeRemaining,
    onClose,
    onSettings,
}: RSVPHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top || 12 }]}>
            {/* Close Button */}
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            {/* Center: Progress & Time */}
            <View style={styles.centerContent}>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                <Text style={styles.separator}> • </Text>
                <Text style={styles.timeText}>{timeRemaining} left</Text>
            </View>

            {/* Settings Button */}
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onSettings}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="settings-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingBottom: 12,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: COLORS.accent,
    },
    separator: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: COLORS.textTertiary,
    },
    timeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});

export default RSVPHeader;
