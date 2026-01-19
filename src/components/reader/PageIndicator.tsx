/**
 * PageIndicator
 * Floating page number that appears during scroll
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { dimensions, typography } from '@/src/constants/readerTheme';

interface PageIndicatorProps {
    visible: boolean;
    currentPage: number;
}

export const PageIndicator: React.FC<PageIndicatorProps> = ({
    visible,
    currentPage,
}) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible, opacity]);

    return (
        <Animated.View
            style={[
                styles.container,
                { opacity },
            ]}
            pointerEvents="none"
        >
            <Text style={styles.text}>Page {currentPage}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 70,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: dimensions.cornerRadius.medium,
        zIndex: 90,
    },
    text: {
        fontFamily: typography.uiFontBold,
        fontSize: typography.sizes.scrollIndicator,
        color: 'rgba(255, 255, 255, 0.8)',
    },
});

export default PageIndicator;
