
import { addDocument, Document, getDocuments, initDatabase } from '@/src/database/db';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryScreen() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const router = useRouter();

    const loadDocuments = useCallback(async () => {
        try {
            const docs = await getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }, []);

    useEffect(() => {
        initDatabase().then(loadDocuments);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadDocuments();
        }, [loadDocuments])
    );

    const importPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const { uri, name } = result.assets[0];

            // Use new FileSystem API
            const sourceFile = new File(uri);
            const destFile = new File(Paths.document, name || 'doc.pdf');

            // Copy the file
            if (destFile.exists) {
                // If destFile exists, delete it before copying to ensure overwrite
                await destFile.delete();
            }
            await sourceFile.copy(destFile);

            // Ensure name is never null for SQLite
            const safeName = name || 'doc.pdf';
            await addDocument(destFile.uri, safeName, 0);
            loadDocuments();
        } catch (error) {
            console.error('Error importing PDF:', error);
        }
    };

    const openReader = (doc: Document) => {
        router.push({
            pathname: '/reader',
            params: { uri: doc.uri, name: doc.name, id: doc.id, lastReadPage: doc.lastReadPage }
        });
    };

    const renderItem = ({ item }: { item: Document }) => (
        <TouchableOpacity style={styles.card} onPress={() => openReader(item)}>
            <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="document-text-outline" size={32} color="#fff" />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>Page {item.lastReadPage}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Library</Text>
                <TouchableOpacity style={styles.addButton} onPress={importPdf}>
                    <Ionicons name="add" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={documents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No PDFs found</Text>
                        <Text style={styles.emptySubtext}>Tap + to add a document</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerTitle: {
        fontFamily: 'InstrumentSerif_400Regular',
        fontSize: 32,
        color: '#fff',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    thumbnailPlaceholder: {
        width: 48,
        height: 64,
        backgroundColor: '#222',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#fff',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#222',
    },
});
