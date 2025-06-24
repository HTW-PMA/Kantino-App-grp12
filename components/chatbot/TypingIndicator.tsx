import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function TypingIndicator() {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const animation1 = animateDot(dot1, 0);
        const animation2 = animateDot(dot2, 200);
        const animation3 = animateDot(dot3, 400);

        animation1.start();
        animation2.start();
        animation3.start();

        return () => {
            animation1.stop();
            animation2.stop();
            animation3.stop();
        };
    }, [dot1, dot2, dot3]);

    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <Text style={styles.text}>Assistant schreibt</Text>
                <View style={styles.dotsContainer}>
                    <Animated.View style={[
                        styles.dot,
                        { opacity: dot1 }
                    ]} />
                    <Animated.View style={[
                        styles.dot,
                        { opacity: dot2 }
                    ]} />
                    <Animated.View style={[
                        styles.dot,
                        { opacity: dot3 }
                    ]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        marginHorizontal: 16,
        alignItems: 'flex-start',
    },
    bubble: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    text: {
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#67B32D',
    },
});