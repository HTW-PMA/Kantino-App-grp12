// components/CustomHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    onMenuPress?: () => void;
}

const CustomHeader: React.FC<HeaderProps> = ({ title, showBack = true, onMenuPress }) => {
    const router = useRouter();

    return (
        <View style={styles.header}>
            {showBack ? (
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="limegreen" />
                </TouchableOpacity>
            ) : (
                <View style={{ width: 24 }} />
            )}

            <Text style={styles.title}>{title}</Text>

            <TouchableOpacity onPress={onMenuPress}>
                <Feather name="menu" size={24} color="limegreen" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#662a60',
        paddingTop: 40,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default CustomHeader;
