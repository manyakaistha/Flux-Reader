import { SortOption } from '@/src/database/db';
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

export interface SortOptionItem {
    value: SortOption;
    label: string;
}

export const SORT_OPTIONS: SortOptionItem[] = [
    { value: 'latest_added', label: 'Latest added' },
    { value: 'alpha_asc', label: 'Alphabetical (A → Z)' },
    { value: 'alpha_desc', label: 'Alphabetical (Z → A)' },
    { value: 'last_read_newest', label: 'Last read (newest first)' },
    { value: 'last_read_oldest', label: 'Last read (oldest first)' },
    { value: 'progress_least', label: 'Progress (least read)' },
    { value: 'progress_most', label: 'Progress (most read)' },
];

interface SortBottomSheetProps {
    visible: boolean;
    currentSort: SortOption;
    onSelect: (sort: SortOption) => void;
    onClose: () => void;
}

export function SortBottomSheet({
    visible,
    currentSort,
    onSelect,
    onClose,
}: SortBottomSheetProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <View style={styles.sheet}>
                    <View style={styles.handle} />

                    <Text style={styles.title}>Sort Documents</Text>

                    <View style={styles.options}>
                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={styles.option}
                                onPress={() => {
                                    onSelect(option.value);
                                    onClose();
                                }}
                            >
                                <View style={styles.optionContent}>
                                    {currentSort === option.value && (
                                        <Ionicons
                                            name="checkmark"
                                            size={20}
                                            color="#4ECDC4"
                                            style={styles.checkmark}
                                        />
                                    )}
                                    <Text
                                        style={[
                                            styles.optionText,
                                            currentSort === option.value && styles.optionTextSelected,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
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
        paddingHorizontal: 20,
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
        marginBottom: 20,
    },
    options: {
        gap: 4,
    },
    option: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkmark: {
        marginRight: 12,
    },
    optionText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#FFFFFF',
    },
    optionTextSelected: {
        fontFamily: 'Inter_500Medium',
        color: '#4ECDC4',
    },
});
