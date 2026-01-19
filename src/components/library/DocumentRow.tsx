import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DocumentRowProps {
    id: number;
    name: string;
    author?: string;
    progress: number; // 0-100
    fileType: 'pdf' | 'epub';
    pageCount?: number;
    lastRead?: string;
    onPress: () => void;
    onLongPress?: () => void;
}

export function DocumentRow({
    name,
    author,
    progress,
    fileType,
    pageCount,
    lastRead,
    onPress,
    onLongPress,
}: DocumentRowProps) {
    const metadataItems = [
        fileType.toUpperCase(),
        pageCount ? `${pageCount} pages` : null,
        lastRead,
    ].filter(Boolean);

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            delayLongPress={400}
        >
            {/* Thumbnail */}
            <View style={styles.thumbnail}>
                <Ionicons name="document-text" size={24} color="rgba(255,255,255,0.3)" />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                    {name}
                </Text>
                {author && (
                    <Text style={styles.author} numberOfLines={1}>
                        {author}
                    </Text>
                )}
                <Text style={styles.metadata} numberOfLines={1}>
                    {metadataItems.join(' • ')}
                </Text>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{progress}%</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    thumbnail: {
        width: 48,
        height: 64,
        backgroundColor: '#1a2030',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 17,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    author: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#B0B0B0',
        marginBottom: 4,
    },
    metadata: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#808080',
    },
    progressContainer: {
        marginLeft: 12,
    },
    progressText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#4ECDC4',
    },
});
