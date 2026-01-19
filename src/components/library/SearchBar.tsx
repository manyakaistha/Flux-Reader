import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export function SearchBar({
    value,
    onChangeText,
    placeholder = 'Search documents...',
}: SearchBarProps) {
    return (
        <View style={styles.container}>
            <Ionicons name="search" size={18} color="#808080" style={styles.icon} />
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                selectionColor="#4ECDC4"
                autoCapitalize="none"
                autoCorrect={false}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color="#808080" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#FFFFFF',
        height: '100%',
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
});
