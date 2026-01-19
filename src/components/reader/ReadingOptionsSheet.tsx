/**
 * ReadingOptionsSheet
 * Bottom sheet with brightness, theme, and other reading options
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { ReaderTheme, typography } from '@/src/constants/readerTheme';

interface ReadingOptionsSheetProps {
    visible: boolean;
    onClose: () => void;
    currentTheme: ReaderTheme;
    onThemeChange: (theme: ReaderTheme) => void;
    brightness: number;
    onBrightnessChange: (value: number) => void;
    onGoToPage: () => void;
}

export const ReadingOptionsSheet: React.FC<ReadingOptionsSheetProps> = ({
    visible,
    onClose,
    currentTheme,
    onThemeChange,
    brightness,
    onBrightnessChange,
    onGoToPage,
}) => {
    const translateY = useSharedValue(300);

    React.useEffect(() => {
        translateY.value = withSpring(visible ? 0 : 300, {
            damping: 20,
            stiffness: 300,
        });
    }, [visible, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const themeOptions: { value: ReaderTheme; label: string }[] = [
        { value: 'auto', label: 'Auto' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'sepia', label: 'Sepia' },
    ];

    const handleThemeSelect = (theme: ReaderTheme) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onThemeChange(theme);
    };

    const handleBrightnessTouch = (event: { nativeEvent: { locationX: number; } }, width: number) => {
        const newValue = Math.max(0, Math.min(100, (event.nativeEvent.locationX / width) * 100));
        onBrightnessChange(Math.round(newValue));
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Animated.View style={[styles.sheet, animatedStyle]}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        {/* Handle */}
                        <View style={styles.handle} />

                        {/* Title */}
                        <Text style={styles.title}>Reading Options</Text>

                        {/* Brightness Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sunny" size={20} color="#888" />
                                <Text style={styles.sectionLabel}>Brightness</Text>
                            </View>
                            <View
                                style={styles.sliderContainer}
                                onTouchMove={(e) => handleBrightnessTouch(e, 280)}
                                onTouchStart={(e) => handleBrightnessTouch(e, 280)}
                            >
                                <View style={styles.sliderTrack}>
                                    <View
                                        style={[
                                            styles.sliderFill,
                                            { width: `${brightness}%` }
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.sliderThumb,
                                            { left: `${brightness}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.sliderValue}>{brightness}%</Text>
                            </View>
                        </View>

                        {/* Theme Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="contrast" size={20} color="#888" />
                                <Text style={styles.sectionLabel}>Theme</Text>
                            </View>
                            <View style={styles.themeOptions}>
                                {themeOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={styles.themeOption}
                                        onPress={() => handleThemeSelect(option.value)}
                                    >
                                        <View
                                            style={[
                                                styles.radioOuter,
                                                currentTheme === option.value && styles.radioActive
                                            ]}
                                        >
                                            {currentTheme === option.value && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                        <Text style={styles.themeLabel}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Actions */}
                        <TouchableOpacity style={styles.actionItem} onPress={onGoToPage}>
                            <Ionicons name="document-text-outline" size={20} color="#888" />
                            <Text style={styles.actionLabel}>Go to page...</Text>
                        </TouchableOpacity>

                        <View style={styles.actionItem}>
                            <Ionicons name="bookmark-outline" size={20} color="#555" />
                            <Text style={[styles.actionLabel, { color: '#555' }]}>
                                Bookmarks (coming soon)
                            </Text>
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#444',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    title: {
        fontFamily: typography.uiFontBold,
        fontSize: typography.sizes.sheetTitle,
        color: '#FFFFFF',
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionLabel: {
        fontFamily: typography.uiFont,
        fontSize: typography.sizes.menuItems,
        color: '#FFFFFF',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    sliderTrack: {
        flex: 1,
        height: 6,
        backgroundColor: '#333',
        borderRadius: 3,
        position: 'relative',
    },
    sliderFill: {
        height: '100%',
        backgroundColor: '#64B5F6',
        borderRadius: 3,
    },
    sliderThumb: {
        position: 'absolute',
        top: -5,
        width: 16,
        height: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginLeft: -8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3,
    },
    sliderValue: {
        fontFamily: typography.uiFontMedium,
        fontSize: typography.sizes.sliderLabel,
        color: '#64B5F6',
        width: 40,
        textAlign: 'right',
    },
    themeOptions: {
        flexDirection: 'row',
        gap: 16,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#555',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioActive: {
        borderColor: '#64B5F6',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#64B5F6',
    },
    themeLabel: {
        fontFamily: typography.uiFont,
        fontSize: typography.sizes.menuItems,
        color: '#FFFFFF',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    actionLabel: {
        fontFamily: typography.uiFont,
        fontSize: typography.sizes.menuItems,
        color: '#FFFFFF',
    },
});

export default ReadingOptionsSheet;
