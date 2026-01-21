import { ReaderFooter, ReaderTopBar } from '@/src/components/reader';
import { RSVPOverlay } from '@/src/components/rsvp/RSVPOverlay';
import { updateLastOpenedAt, updateLastReadPage, updatePageCount } from '@/src/database/db';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    View
} from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const AUTO_HIDE_DELAY = 3000;
const PROGRESS_SAVE_DEBOUNCE = 2000;

export default function ReaderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        uri: string;
        name: string;
        id: string;
        lastReadPage: string;
    }>();

    const { uri, name, id, lastReadPage: lastReadPageParam } = params;
    const docId = parseInt(id || '0', 10);
    const initialPage = parseInt(lastReadPageParam || '1', 10);

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(0);
    const [chromeVisible, setChromeVisible] = useState(true);
    const [showRSVP, setShowRSVP] = useState(false);
    const [rsvpStartPage, setRsvpStartPage] = useState<number | undefined>(undefined);

    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pdfRef = useRef<any>(null);

    // Auto-hide chrome after delay
    const resetHideTimer = useCallback(() => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
        }
        hideTimer.current = setTimeout(() => {
            setChromeVisible(false);
        }, AUTO_HIDE_DELAY);
    }, []);

    // Toggle chrome on tap
    const toggleChrome = useCallback(() => {
        setChromeVisible((prev) => {
            if (!prev) {
                resetHideTimer();
            }
            return !prev;
        });
    }, [resetHideTimer]);

    // Show chrome and reset timer
    const showChrome = useCallback(() => {
        setChromeVisible(true);
        resetHideTimer();
    }, [resetHideTimer]);

    // Save progress (debounced)
    const saveProgress = useCallback((page: number) => {
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        }
        saveTimer.current = setTimeout(async () => {
            try {
                await updateLastReadPage(docId, page);
            } catch (error) {
                console.error('Error saving progress:', error);
            }
        }, PROGRESS_SAVE_DEBOUNCE);
    }, [docId]);

    // Handle page change
    const handlePageChanged = useCallback((page: number) => {
        setCurrentPage(page);
        saveProgress(page);
    }, [saveProgress]);

    // Handle back navigation
    const handleBack = useCallback(async () => {
        // Save progress immediately on exit
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        }
        try {
            await updateLastReadPage(docId, currentPage);
        } catch (error) {
            console.error('Error saving final progress:', error);
        }
        router.back();
    }, [docId, currentPage, router]);

    // Handle RSVP button tap - resume from saved position
    const handleRSVPPress = useCallback(() => {
        setChromeVisible(false);
        setRsvpStartPage(undefined); // No start page = resume from saved
        setShowRSVP(true);
    }, []);

    // Handle RSVP button long-press - start from current visible page
    const handleRSVPLongPress = useCallback(() => {
        setChromeVisible(false);
        setRsvpStartPage(currentPage); // Start from current page
        setShowRSVP(true);
    }, [currentPage]);

    // Handle RSVP overlay close
    const handleRSVPClose = useCallback(() => {
        setShowRSVP(false);
        setRsvpStartPage(undefined);
        showChrome();
    }, [showChrome]);

    // Update lastOpenedAt on mount
    useEffect(() => {
        updateLastOpenedAt(docId).catch(console.error);
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [docId]);

    // Initial auto-hide timer
    useEffect(() => {
        resetHideTimer();
    }, [resetHideTimer]);

    const source = { uri: uri, cache: true };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <StatusBar style="light" hidden={!chromeVisible} />

                {/* PDF Content */}
                <View style={styles.pdfContainer}>
                    <Pdf
                        ref={pdfRef}
                        source={source}
                        page={initialPage}
                        horizontal={false}
                        enablePaging={false}
                        onLoadComplete={(numberOfPages) => {
                            setTotalPages(numberOfPages);
                            updatePageCount(docId, numberOfPages).catch(console.error);
                        }}
                        onPageChanged={handlePageChanged}
                        onPageSingleTap={toggleChrome}
                        onError={(error) => {
                            console.error('PDF Error:', error);
                        }}
                        style={styles.pdf}
                        trustAllCerts={false}
                        enableAnnotationRendering={false}
                        fitPolicy={0}
                        minScale={1.0}
                        maxScale={3.0}
                        spacing={24}
                    />
                </View>

                {/* Top Bar */}
                <ReaderTopBar
                    title={name || 'Document'}
                    visible={chromeVisible}
                    onBack={handleBack}
                    onRSVPPress={handleRSVPPress}
                    onRSVPLongPress={handleRSVPLongPress}
                />

                {/* Footer */}
                <ReaderFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    visible={chromeVisible}
                />

                {/* RSVP Overlay */}
                <RSVPOverlay
                    visible={showRSVP}
                    docId={docId}
                    documentName={name || 'Document'}
                    pdfUri={uri || ''}
                    startFromPage={rsvpStartPage}
                    onClose={handleRSVPClose}
                />
            </View>
        </SafeAreaProvider>
    );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a14',
    },
    pdfContainer: {
        flex: 1,
    },
    pdf: {
        flex: 1,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#0a0a14',
    },
});
