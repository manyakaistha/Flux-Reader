import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RSVPHeaderProps {
    documentTitle: string;
    onClose: () => void;
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
 * Displays book title with back button
 */
export function RSVPHeader({
    documentTitle,
    onClose,
}: RSVPHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top || 12 }]}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.iconButton}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            {/* Center: Book Title */}
            <View style={styles.centerContent}>
                <Text style={styles.titleText} numberOfLines={1}>
                    {documentTitle}
                </Text>
            </View>

            {/* Right: Empty spacer for symmetry */}
            <View style={styles.spacer} />
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
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    titleText: {
        fontFamily: 'InstrumentSerif_400Regular',
        fontSize: 18,
        color: COLORS.textPrimary,
    },
    spacer: {
        width: 48,
    },
});

export default RSVPHeader;
