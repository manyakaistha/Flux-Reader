import {
    DocumentCard,
    DocumentDetailsSheet,
    DocumentRow,
    EmptyState,
    SearchBar,
    SORT_OPTIONS,
    SortBottomSheet,
} from '@/src/components/library';
import {
    addDocument,
    deleteDocument,
    Document,
    getDocuments,
    initDatabase,
    SortOption,
    updateLastOpenedAt,
} from '@/src/database/db';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function LibraryScreen() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortOption, setSortOption] = useState<SortOption>('latest_added');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showSortSheet, setShowSortSheet] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [showDetailsSheet, setShowDetailsSheet] = useState(false);
    const router = useRouter();

    const loadDocuments = useCallback(async () => {
        try {
            const docs = await getDocuments(sortOption);
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }, [sortOption]);

    useEffect(() => {
        initDatabase().then(loadDocuments);
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [sortOption]);

    useFocusEffect(
        useCallback(() => {
            loadDocuments();
        }, [loadDocuments])
    );

    // Filter documents by search query
    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const query = searchQuery.toLowerCase();
        return documents.filter(
            (doc) =>
                doc.name.toLowerCase().includes(query) ||
                doc.author?.toLowerCase().includes(query)
        );
    }, [documents, searchQuery]);

    const importPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/epub+zip'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            const { uri, name, size, mimeType } = asset;

            // Use new FileSystem API
            const sourceFile = new File(uri);
            const destFile = new File(Paths.document, name || 'doc.pdf');

            // Copy the file
            if (destFile.exists) {
                await destFile.delete();
            }
            await sourceFile.copy(destFile);

            const fileType = mimeType?.includes('epub') ? 'epub' : 'pdf';

            await addDocument({
                uri: destFile.uri,
                name: name || 'document',
                pageCount: 0,
                fileSize: size,
                fileType,
            });
            loadDocuments();
        } catch (error) {
            console.error('Error importing document:', error);
        }
    };

    const openReader = async (doc: Document) => {
        await updateLastOpenedAt(doc.id);
        router.push({
            pathname: '/reader' as const,
            params: { uri: doc.uri, name: doc.name, id: doc.id.toString(), lastReadPage: doc.lastReadPage.toString() },
        } as any);
    };

    const handleLongPress = (doc: Document) => {
        setSelectedDocument(doc);
        setShowDetailsSheet(true);
    };

    const handleRemoveDocument = async () => {
        if (!selectedDocument) return;
        try {
            await deleteDocument(selectedDocument.id);
            setShowDetailsSheet(false);
            setSelectedDocument(null);
            loadDocuments();
        } catch (error) {
            console.error('Error removing document:', error);
        }
    };

    const getProgress = (doc: Document): number => {
        if (!doc.pageCount || doc.pageCount === 0) return 0;
        return Math.round((doc.lastReadPage / doc.pageCount) * 100);
    };

    const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortOption)?.label || 'Sort';

    const renderGridItem = ({ item, index }: { item: Document; index: number }) => (
        <View style={[styles.gridItem, { marginLeft: index % NUM_COLUMNS === 0 ? 0 : CARD_GAP }]}>
            <DocumentCard
                id={item.id}
                name={item.name}
                author={item.author}
                progress={getProgress(item)}
                fileType={item.fileType || 'pdf'}
                onPress={() => openReader(item)}
                onLongPress={() => handleLongPress(item)}
            />
        </View>
    );

    const renderListItem = ({ item }: { item: Document }) => (
        <View style={styles.listItem}>
            <DocumentRow
                id={item.id}
                name={item.name}
                author={item.author}
                progress={getProgress(item)}
                fileType={item.fileType || 'pdf'}
                pageCount={item.pageCount}
                onPress={() => openReader(item)}
                onLongPress={() => handleLongPress(item)}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="library" size={20} color="#4ECDC4" />
                    </View>
                    <Text style={styles.headerTitle}>Library</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setShowSearch(!showSearch)}
                    >
                        <Ionicons name="search" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={importPdf}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            {showSearch && (
                <View style={styles.searchContainer}>
                    <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
                </View>
            )}

            {/* Control Strip */}
            <View style={styles.controlStrip}>
                <TouchableOpacity
                    style={styles.sortChip}
                    onPress={() => setShowSortSheet(true)}
                >
                    <Text style={styles.sortLabel}>Sort: {currentSortLabel}</Text>
                    <Ionicons name="chevron-down" size={16} color="#B0B0B0" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.viewToggle}
                    onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                    <Ionicons
                        name={viewMode === 'grid' ? 'grid' : 'list'}
                        size={20}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            {/* Document List/Grid */}
            {filteredDocuments.length === 0 ? (
                <EmptyState onAddDocument={importPdf} />
            ) : viewMode === 'grid' ? (
                <FlatList
                    key="grid"
                    data={filteredDocuments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderGridItem}
                    numColumns={NUM_COLUMNS}
                    contentContainerStyle={styles.gridContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <FlatList
                    key="list"
                    data={filteredDocuments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderListItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Sort Bottom Sheet */}
            <SortBottomSheet
                visible={showSortSheet}
                currentSort={sortOption}
                onSelect={setSortOption}
                onClose={() => setShowSortSheet(false)}
            />

            {/* Document Details Sheet */}
            <DocumentDetailsSheet
                visible={showDetailsSheet}
                document={
                    selectedDocument
                        ? {
                            name: selectedDocument.name,
                            author: selectedDocument.author,
                            fileType: selectedDocument.fileType || 'pdf',
                            fileSize: selectedDocument.fileSize,
                            pageCount: selectedDocument.pageCount,
                            lastReadPage: selectedDocument.lastReadPage,
                            createdAt: selectedDocument.createdAt,
                            lastOpenedAt: selectedDocument.lastOpenedAt,
                        }
                        : null
                }
                onClose={() => {
                    setShowDetailsSheet(false);
                    setSelectedDocument(null);
                }}
                onOpen={() => {
                    setShowDetailsSheet(false);
                    if (selectedDocument) openReader(selectedDocument);
                }}
                onRemove={handleRemoveDocument}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a14',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: 'rgba(78,205,196,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        color: '#fff',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    controlStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sortLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#B0B0B0',
        marginRight: 6,
    },
    viewToggle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: 80,
    },
    gridItem: {
        width: CARD_WIDTH,
        marginBottom: CARD_GAP,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    listItem: {
        marginBottom: 12,
    },
});
