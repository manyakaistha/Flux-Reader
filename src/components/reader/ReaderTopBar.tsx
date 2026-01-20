import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RSVPButton } from './RSVPButton';

interface ReaderTopBarProps {
    title: string;
    visible: boolean;
    onBack: () => void;
    onRSVPPress: () => void;
    onRSVPLongPress: () => void;
}

export function ReaderTopBar({
    title,
    visible,
    onBack,
    onRSVPPress,
    onRSVPLongPress,
}: ReaderTopBarProps) {
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    return (
        <Animated.View
            entering={SlideInUp.duration(250)}
            exiting={SlideOutUp.duration(250)}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
                <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
            )}

            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Title */}
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                </Text>

                {/* RSVP Button */}
                <RSVPButton onPress={onRSVPPress} onLongPress={onRSVPLongPress} />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    androidBackground: {
        backgroundColor: 'rgba(10, 10, 20, 0.95)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        height: 56,
    },
    backButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        fontFamily: 'InstrumentSerif_400Regular',
        fontSize: 18,
        color: '#FFFFFF',
        marginHorizontal: 8,
    },
});
