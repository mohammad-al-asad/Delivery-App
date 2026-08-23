import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Colors } from '../constants/Colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon
}) => {
    const getBackgroundColor = () => {
        if (disabled) return Colors.gray[300];
        switch (variant) {
            case 'primary': return Colors.primary;
            case 'secondary': return Colors.secondary;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return Colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return Colors.gray[500];
        switch (variant) {
            case 'primary': return Colors.secondary;
            case 'secondary': return Colors.white;
            case 'outline': return Colors.text;
            case 'ghost': return Colors.textLight;
            default: return Colors.secondary;
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return Colors.primary;
        return 'transparent';
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 2 : 0,
                },
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ disabled, busy: loading }}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'secondary' ? Colors.white : Colors.text} />
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
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        marginVertical: 8,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
