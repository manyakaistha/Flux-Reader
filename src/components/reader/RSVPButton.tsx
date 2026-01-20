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
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        // Scale down
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();

        // Start warning timer (300ms)
        warningTimer.current = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Start glow animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.5,
                        duration: 300,
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        }, LONG_PRESS_WARNING);

        // Start long press timer (500ms)
        longPressTimer.current = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            // Scale up briefly
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
            glowAnim.setValue(0);
            onLongPress();
        }, LONG_PRESS_THRESHOLD);
    }, [scaleAnim, glowAnim, clearTimers, onLongPress]);

    const handlePressOut = useCallback(() => {
        clearTimers();
        setIsPressing(false);

        // Reset animations
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
        glowAnim.setValue(0);
    }, [scaleAnim, glowAnim, clearTimers]);

    const handlePress = useCallback(() => {
        if (!isPressing) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    }, [isPressing, onPress]);

    const glowStyle = {
        shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.8],
        }),
        shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 16],
        }),
    };

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
                    glowStyle,
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
    icon: {
        marginRight: 6,
    },
    text: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: '#000000',
    },
});
