import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    onBackPress?: () => void;
}

const CustomHeader: React.FC<HeaderProps> = ({
                                                 title,
                                                 showBack = true,
                                                 onBackPress
                                             }) => {
    const router = useRouter();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <View style={styles.header}>
            {showBack ? (
                <TouchableOpacity onPress={handleBackPress}>
                    <Feather name="arrow-left" size={24} color="limegreen" />
                </TouchableOpacity>
            ) : (
                <View style={{ width: 24 }} />
            )}

            <Text style={styles.title}>{title}</Text>

            {/* Rechte Seite leer, damit Titel zentriert bleibt */}
            <View style={{ width: 24 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#662a60',
        paddingTop: 50,
        paddingBottom: 20,
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
