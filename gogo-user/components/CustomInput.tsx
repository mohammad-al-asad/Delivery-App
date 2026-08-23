import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface CustomInputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const CustomInput: React.FC<CustomInputProps> = ({
    label,
    error,
    icon,
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnimation = useSharedValue(0);

    const handleFocus = (event: any) => {
        setIsFocused(true);
        focusAnimation.value = withTiming(1, { duration: 200 });
        props.onFocus?.(event);
    };

    const handleBlur = (event: any) => {
        setIsFocused(false);
        focusAnimation.value = withTiming(0, { duration: 200 });
        props.onBlur?.(event);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        borderColor: focusAnimation.value === 1 ? Colors.primary : '#EFEFEF',
        backgroundColor: focusAnimation.value === 1 ? '#fff' : '#FAFAFA',
        shadowOpacity: focusAnimation.value * 0.1,
    }));

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Animated.View style={[styles.inputWrapper, animatedStyle, error && styles.inputError]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    {...props}
                    style={[styles.input, style]}
                    placeholderTextColor="#999"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
            </Animated.View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderWidth: 1.5,
        borderColor: '#EFEFEF',
        borderRadius: 16,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 2,
    },
    inputError: {
        borderColor: '#FF5252',
    },
    iconContainer: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    errorText: {
        fontSize: 12,
        color: '#FF5252',
        marginTop: 4,
        marginLeft: 4,
    },
});
