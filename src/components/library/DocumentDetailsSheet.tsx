import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DocumentDetailsSheetProps {
    visible: boolean;
    document: {
        name: string;
        author?: string;
        fileType: 'pdf' | 'epub';
        fileSize?: number;
        pageCount?: number;
        lastReadPage: number;
        createdAt: string;
        lastOpenedAt?: string;
    } | null;
    onClose: () => void;
    onOpen: () => void;
    onRemove: () => void;
}

function formatBytes(bytes?: number): string {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function getRelativeTime(dateStr?: string): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr);
}

export function DocumentDetailsSheet({
    visible,
    document,
    onClose,
    onOpen,
    onRemove,
}: DocumentDetailsSheetProps) {
    if (!document) return null;

    const progress = document.pageCount
        ? Math.round((document.lastReadPage / document.pageCount) * 100)
        : 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.handle} />

                    <Text style={styles.title}>Document Details</Text>

                    {/* Title */}
                    <View style={styles.field}>
                        <Text style={styles.label}>TITLE</Text>
                        <Text style={styles.valueTitle}>{document.name}</Text>
                    </View>

                    {/* Author */}
                    {document.author && (
                        <View style={styles.field}>
                            <Text style={styles.label}>AUTHOR</Text>
                            <Text style={styles.value}>{document.author}</Text>
                        </View>
                    )}

                    {/* Type & Size */}
                    <View style={styles.field}>
                        <Text style={styles.label}>TYPE</Text>
                        <Text style={styles.value}>
                            {document.fileType.toUpperCase()} • {formatBytes(document.fileSize)}
                        </Text>
                    </View>

                    {/* Progress */}
                    <View style={styles.field}>
                        <Text style={styles.label}>PROGRESS</Text>
                        <Text style={styles.value}>
                            {progress}% complete ({document.lastReadPage}/{document.pageCount || '?'} pages)
                        </Text>
                    </View>

                    {/* Added */}
                    <View style={styles.field}>
                        <Text style={styles.label}>ADDED</Text>
                        <Text style={styles.value}>{formatDate(document.createdAt)}</Text>
                    </View>

                    {/* Last Opened */}
                    <View style={styles.field}>
                        <Text style={styles.label}>LAST OPENED</Text>
                        <Text style={styles.value}>{getRelativeTime(document.lastOpenedAt)}</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.openButton} onPress={onOpen}>
                            <Text style={styles.openButtonText}>Open</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
                            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                            <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        color: '#FFFFFF',
        marginBottom: 24,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: '#808080',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    valueTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    value: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#FFFFFF',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    openButton: {
        flex: 1,
        backgroundColor: '#4ECDC4',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    openButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#000000',
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,107,107,0.1)',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,107,107,0.3)',
    },
    removeButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#FF6B6B',
        marginLeft: 8,
    },
});
