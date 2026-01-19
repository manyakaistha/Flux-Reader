import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { RSVPToken } from '../../types';
import { shouldApplyORP } from '../../utils/tokenizer';

interface WordDisplayProps {
    token: RSVPToken | null;
    baseFontSize?: number;
    minimumFontSize?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * RSVP Word Display Component
 * Displays a single word with ORP (Optimal Recognition Point) alignment
 * 
 * Layout: [Left Segment (45%)] | [ORP Marker] | [Right Segment (45%)]
 * The ORP character is highlighted in red and centered
 */
export function WordDisplay({
    token,
    baseFontSize = 48,
    minimumFontSize = 24
}: WordDisplayProps) {

    // Calculate font size based on word length
    const fontSize = useMemo(() => {
        if (!token) return baseFontSize;

        const maxWidth = SCREEN_WIDTH * 0.85;
        // Approximate character width (varies by font, but good estimate)
        const charWidth = baseFontSize * 0.6;
        const estimatedWordWidth = token.text.length * charWidth;

        if (estimatedWordWidth <= maxWidth) {
            return baseFontSize;
        }

        // Calculate shrink factor
        const shrinkFactor = maxWidth / estimatedWordWidth;
        const shrunkenSize = Math.floor(baseFontSize * shrinkFactor);

        return Math.max(shrunkenSize, minimumFontSize);
    }, [token, baseFontSize, minimumFontSize]);

    if (!token) {
        return (
            <View style={styles.container}>
                <Text style={[styles.placeholderText, { fontSize }]}>Ready</Text>
            </View>
        );
    }

    // Check if we should apply ORP alignment
    const useORP = shouldApplyORP(token);

    if (!useORP) {
        // Center-align punctuation and short words
        return (
            <View style={styles.container}>
                <Text style={[styles.centeredText, { fontSize }]}>{token.text}</Text>
            </View>
        );
    }

    // ORP-aligned display
    return (
        <View style={styles.container}>
            <View style={styles.wordContainer}>
                {/* Left segment - right-aligned */}
                <View style={styles.leftSegment}>
                    <Text style={[styles.leftText, { fontSize }]} numberOfLines={1}>
                        {token.leftPart}
                    </Text>
                </View>

                {/* ORP character - centered, red */}
                <View style={styles.orpMarker}>
                    <Text style={[styles.orpChar, { fontSize }]}>
                        {token.orpChar}
                    </Text>
                </View>

                {/* Right segment - left-aligned */}
                <View style={styles.rightSegment}>
                    <Text style={[styles.rightText, { fontSize }]} numberOfLines={1}>
                        {token.rightPart}
                    </Text>
                </View>
            </View>

            {/* ORP guide line */}
            <View style={styles.guideLineContainer}>
                <View style={styles.guideLine} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        minHeight: 100,
    },
    wordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftSegment: {
        flex: 0.45,
        alignItems: 'flex-end',
        paddingRight: 2,
    },
    leftText: {
        fontFamily: 'Inter_500Medium',
        color: '#fff',
        textAlign: 'right',
    },
    orpMarker: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
    },
    orpChar: {
        fontFamily: 'Inter_600SemiBold',
        color: '#ff4444',
        fontWeight: 'bold',
    },
    rightSegment: {
        flex: 0.45,
        alignItems: 'flex-start',
        paddingLeft: 2,
    },
    rightText: {
        fontFamily: 'Inter_500Medium',
        color: '#fff',
        textAlign: 'left',
    },
    centeredText: {
        fontFamily: 'Inter_500Medium',
        color: '#fff',
        textAlign: 'center',
    },
    placeholderText: {
        fontFamily: 'Inter_400Regular',
        color: '#666',
        textAlign: 'center',
    },
    guideLineContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    guideLine: {
        width: 2,
        height: '100%',
        backgroundColor: '#ff4444',
        opacity: 0.3,
    },
});

export default WordDisplay;
