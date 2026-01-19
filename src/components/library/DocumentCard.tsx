import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DocumentCardProps {
    id: number;
    name: string;
    author?: string;
    progress: number; // 0-100
    fileType: 'pdf' | 'epub';
    onPress: () => void;
    onLongPress?: () => void;
}

export function DocumentCard({
    name,
    author,
    progress,
    fileType,
    onPress,
    onLongPress,
}: DocumentCardProps) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            delayLongPress={400}
        >
            {/* Cover Image Placeholder */}
            <View style={styles.cover}>
                <Ionicons name="document-text" size={32} color="rgba(255,255,255,0.3)" />
            </View>

            {/* Info Section */}
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                    {name}
                </Text>
                {author && (
                    <Text style={styles.author} numberOfLines={1}>
                        {author}
                    </Text>
                )}

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                </View>

                {/* File Type Badge */}
                <Text style={styles.fileType}>{fileType.toUpperCase()}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cover: {
        aspectRatio: 0.7,
        backgroundColor: '#1a2030',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        padding: 12,
    },
    title: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: '#FFFFFF',
        lineHeight: 20,
        marginBottom: 4,
    },
    author: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#B0B0B0',
        marginBottom: 8,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginRight: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4ECDC4',
        borderRadius: 2,
    },
    progressText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: '#4ECDC4',
    },
    fileType: {
        fontFamily: 'Inter_400Regular',
        fontSize: 10,
        color: '#808080',
    },
});
