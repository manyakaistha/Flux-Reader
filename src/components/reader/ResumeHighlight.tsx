/**
 * ResumeHighlight
 * Yellow highlight overlay for resume position
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { animations, dimensions, themes } from '@/src/constants/readerTheme';

interface ResumeHighlightProps {
    visible: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    theme?: 'light' | 'dark' | 'sepia';
    onFadeComplete?: () => void;
}

export const ResumeHighlight: React.FC<ResumeHighlightProps> = ({
    visible,
    x,
    y,
    width,
    height,
    theme = 'dark',
    onFadeComplete,
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    const colors = themes[theme];

    useEffect(() => {
        if (visible) {
            // Fade in → persist → fade out animation sequence
            Animated.sequence([
                // Fade in with subtle scale pulse
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: animations.highlightFadeIn,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(scale, {
                            toValue: 1.05,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scale, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
                // Persist
                Animated.delay(animations.highlightPersist),
                // Fade out
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: animations.highlightFadeOut,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onFadeComplete?.();
            });
        } else {
            opacity.setValue(0);
            scale.setValue(1);
        }
    }, [visible, opacity, scale, onFadeComplete]);

    if (!visible || width === 0 || height === 0) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.highlight,
                {
                    left: x - 4,
                    top: y - 2,
                    width: width + 8,
                    height: height + 4,
                    backgroundColor: colors.highlight,
                    opacity: Animated.multiply(opacity, colors.highlightOpacity),
                    transform: [{ scale }],
                },
            ]}
            pointerEvents="none"
        />
    );
};

const styles = StyleSheet.create({
    highlight: {
        position: 'absolute',
        borderRadius: dimensions.cornerRadius.small,
        zIndex: 50,
    },
});

export default ResumeHighlight;
