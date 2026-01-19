import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmptyStateProps {
    onAddDocument: () => void;
}

export function EmptyState({ onAddDocument }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            {/* Illustration */}
            <View style={styles.illustration}>
                <Ionicons name="library-outline" size={80} color="rgba(255,255,255,0.2)" />
            </View>

            {/* Heading */}
            <Text style={styles.heading}>No documents yet</Text>

            {/* Body Text */}
            <Text style={styles.body}>
                Tap the + button to add PDFs{'\n'}or EPUBs from your device.
            </Text>

            {/* CTA Button */}
            <TouchableOpacity style={styles.button} onPress={onAddDocument}>
                <Ionicons name="add" size={20} color="#000" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add Document</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    illustration: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    heading: {
        fontFamily: 'Inter_700Bold',
        fontSize: 22,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    body: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#B0B0B0',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: 280,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4ECDC4',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#000000',
    },
});
