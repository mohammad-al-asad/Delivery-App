
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon
}: ButtonProps) {

    const getBackgroundColor = () => {
        if (disabled) return '#E0E0E0';
        switch (variant) {
            case 'primary': return Colors.primary;
            case 'secondary': return Colors.secondary;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return Colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return '#999';
        switch (variant) {
            case 'primary': return '#000';
            case 'secondary': return '#FFF';
            case 'outline': return '#000';
            case 'ghost': return '#666';
            default: return '#000';
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return '#000';
        return 'transparent';
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 1.5 : 0,
                },
                style
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled, busy: loading }}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'secondary' ? '#fff' : '#000'} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    }
});
