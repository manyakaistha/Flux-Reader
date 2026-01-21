import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text
} from 'react-native';

const LONG_PRESS_THRESHOLD = 500;
const LONG_PRESS_WARNING = 300;

interface RSVPButtonProps {
    onPress: () => void;
    onLongPress: () => void;
}

export function RSVPButton({ onPress, onLongPress }: RSVPButtonProps) {
    const [isPressing, setIsPressing] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggered = useRef(false);

    const clearTimers = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (warningTimer.current) {
            clearTimeout(warningTimer.current);
            warningTimer.current = null;
        }
    }, []);

    const handlePressIn = useCallback(() => {
        setIsPressing(true);
        longPressTriggered.current = false;

        // Scale down
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();

        // Start warning timer (300ms) - show glow
        warningTimer.current = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsGlowing(true);
        }, LONG_PRESS_WARNING);

        // Start long press timer (500ms)
        longPressTimer.current = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            longPressTriggered.current = true;

            // Scale up briefly then reset
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1.1,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
            ]).start();

            clearTimers();
            setIsPressing(false);
            setIsGlowing(false);
            onLongPress();
        }, LONG_PRESS_THRESHOLD);
    }, [scaleAnim, clearTimers, onLongPress]);

    const handlePressOut = useCallback(() => {
        clearTimers();
        setIsPressing(false);
        setIsGlowing(false);

        // Reset scale
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim, clearTimers]);

    const handlePress = useCallback(() => {
        // Only trigger tap if long-press wasn't triggered
        if (!longPressTriggered.current) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    }, [onPress]);

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.button,
                    { transform: [{ scale: scaleAnim }] },
                    isGlowing && styles.glowing,
                ]}
            >
                <Ionicons name="flash" size={16} color="#000" style={styles.icon} />
                <Text style={styles.text}>RSVP</Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4ECDC4',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    glowing: {
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 8,
    },
    icon: {
        marginRight: 6,
    },
    text: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: '#000000',
    },
});
