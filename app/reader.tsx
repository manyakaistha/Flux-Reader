import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Pdf from 'react-native-pdf';
import Animated, { runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { updateLastReadPage } from '@/src/database/db';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function ReaderScreen() {
    const { uri, name, id, lastReadPage } = useLocalSearchParams();

    // State
    const [totalPages, setTotalPages] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [sliderWidth, setSliderWidth] = useState(0);

    // This is the source of truth for the PDF viewer
    const [pdfPage, setPdfPage] = useState(Number(lastReadPage) || 1);

    const pdfRef = useRef<Pdf>(null);
    const router = useRouter();

    // Shared Values for Animation
    const headerOpacity = useSharedValue(1);
    const footerOpacity = useSharedValue(1);
    const isDragging = useSharedValue(false);
    const sliderProgress = useSharedValue(0); // 0 to 1

    useEffect(() => {
        headerOpacity.value = withTiming(controlsVisible ? 1 : 0);
        footerOpacity.value = withTiming(controlsVisible ? 1 : 0);
    }, [controlsVisible]);

    // Sync slider progress when page changes externally
    useEffect(() => {
        if (totalPages > 0 && !isDragging.value) {
            const progress = (pdfPage / totalPages);
            sliderProgress.value = withTiming(progress, { duration: 200 });
        }
    }, [pdfPage, totalPages]);

    const headerStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
        transform: [{ translateY: withTiming(controlsVisible ? 0 : -100) }],
    }));

    const footerStyle = useAnimatedStyle(() => ({
        opacity: footerOpacity.value,
        transform: [{ translateY: withTiming(controlsVisible ? 0 : 200) }],
    }));

    const sliderFillStyle = useAnimatedStyle(() => ({
        width: `${sliderProgress.value * 100}%`
    }));

    const sliderKnobStyle = useAnimatedStyle(() => ({
        left: `${sliderProgress.value * 100}%`
    }));

    // Animated Props for the Page Indicator Text
    // This allows us to update the text WITHOUT re-rendering the component
    const animatedTextProps = useAnimatedProps(() => {
        if (totalPages === 0) return { text: "Loading..." };
        const page = Math.max(1, Math.round(sliderProgress.value * totalPages));
        return {
            text: `${page} / ${totalPages}`
        };
    });

    const toggleControls = () => {
        setControlsVisible(!controlsVisible);
    };

    const onPageChanged = (page: number, numberOfPages: number) => {
        if (!isDragging.value) {
            setPdfPage(page);
        }
        setTotalPages(numberOfPages);
        if (id) {
            updateLastReadPage(Number(id), page);
        }
    };

    // JS helper called on drag end to commit the page
    const commitPage = (progress: number) => {
        if (totalPages === 0) return;
        const newPage = Math.max(1, Math.round(progress * totalPages));
        setPdfPage(newPage);
        pdfRef.current?.setPage(newPage);
    };

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            isDragging.value = true;
        })
        .onUpdate((e) => {
            if (sliderWidth === 0) return;
            const rawProgress = e.x / sliderWidth;
            const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
            sliderProgress.value = clampedProgress;
            // No runOnJS here! Completely native UI thread update.
        })
        .onFinalize(() => {
            isDragging.value = false;
            runOnJS(commitPage)(sliderProgress.value);
        });

    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar hidden={!controlsVisible} style="light" />

            <Pdf
                ref={pdfRef}
                source={{ uri: uri as string, cache: true }}
                onLoadComplete={(numberOfPages) => {
                    setTotalPages(numberOfPages);
                }}
                onPageChanged={onPageChanged}
                onError={(error) => {
                    console.log(error);
                }}
                onPressLink={(linkUri) => {
                    console.log(`Link pressed: ${linkUri}`);
                }}
                style={styles.pdf}
                page={pdfPage}
                singlePage={false}
                onTap={toggleControls}
                usePDFKit={Platform.OS === 'ios'}
            />

            {/* Top Header */}
            <Animated.View style={[styles.headerContainer, headerStyle]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
                <View style={styles.headerPillContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.glassPillSmall}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.glassPillLarge}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
                    </View>

                    <TouchableOpacity style={styles.glassPillSmall}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <Ionicons name="list" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Bottom Control Deck */}
            <Animated.View style={[styles.footerContainer, footerStyle]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
                <View style={styles.glassDeck}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

                    {/* Page Indicator Capsule */}
                    <View style={styles.capsuleContainer}>
                        <View style={styles.pageCapsule}>
                            {/* We use a readonly TextInput to display animated values without re-renders */}
                            <AnimatedTextInput
                                underlineColorAndroid="transparent"
                                editable={false}
                                value={`${pdfPage} / ${totalPages}`} // Initial value
                                animatedProps={animatedTextProps}
                                style={styles.capsuleText}
                            />
                        </View>
                    </View>

                    {/* Scrubber */}
                    <View style={styles.scrubberRow}>
                        <View
                            style={styles.sliderTrack}
                            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                        >
                            <Animated.View style={[styles.sliderFill, sliderFillStyle]} />
                            <GestureDetector gesture={panGesture}>
                                <Animated.View style={[styles.sliderKnob, sliderKnobStyle]} />
                            </GestureDetector>
                        </View>
                    </View>
                </View>
            </Animated.View>

        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: '#000',
    },
    headerContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    headerPillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '90%',
    },
    glassPillSmall: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    glassPillLarge: {
        flex: 1,
        height: 50,
        marginHorizontal: 10,
        borderRadius: 25,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
    },
    headerTitle: {
        color: '#fff',
        fontFamily: 'InstrumentSerif_400Regular',
        fontSize: 22,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    glassDeck: {
        width: '94%',
        borderRadius: 35,
        overflow: 'hidden',
        backgroundColor: 'rgba(20,20,20,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    capsuleContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    pageCapsule: {
        backgroundColor: 'rgba(70, 70, 70, 0.9)', // Slightly darker for better contrast
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 20,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    capsuleText: {
        color: '#fff',
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        textAlign: 'center',
        padding: 0, // Reset default TextInput padding
    },
    scrubberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 40,
    },
    sliderTrack: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 10,
        borderRadius: 2,
        position: 'relative',
        justifyContent: 'center',
    },
    sliderFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    sliderKnob: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        top: -10,
        marginLeft: -12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});
