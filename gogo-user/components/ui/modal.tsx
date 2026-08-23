import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    KeyboardAvoidingView,
    Modal as RNModal,
    Platform,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
    ZoomIn,
    ZoomOut,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';

export interface AppModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    position?: 'center' | 'bottom';
    showHandle?: boolean;
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    avoidKeyboard?: boolean;
}

export function AppModal({
    visible,
    onClose,
    title,
    subtitle,
    position = 'center',
    showHandle = position === 'bottom',
    showCloseButton = true,
    closeOnBackdrop = true,
    headerRight,
    children,
    containerStyle,
    contentStyle,
    avoidKeyboard = true,
}: AppModalProps) {
    if (!visible) return null;

    const isBottom = position === 'bottom';

    const enterAnimation = isBottom
        ? SlideInDown.duration(280).damping(20)
        : ZoomIn.duration(220);

    const exitAnimation = isBottom
        ? SlideOutDown.duration(200)
        : ZoomOut.duration(180);

    const modalContent = (
        <View style={[styles.overlay, isBottom ? styles.overlayBottom : styles.overlayCenter]}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={styles.backdrop}
                />
            </TouchableWithoutFeedback>

            {/* Centered Modal / Bottom Sheet Card */}
            <Animated.View
                entering={enterAnimation}
                exiting={exitAnimation}
                style={[
                    styles.modalContainer,
                    isBottom ? styles.modalBottom : styles.modalCenter,
                    containerStyle,
                ]}
            >
                {/* Pull Handle Indicator (for bottom sheet style only) */}
                {isBottom && showHandle && <View style={styles.handle} />}

                {/* Header */}
                {(title || subtitle || showCloseButton || headerRight) && (
                    <View style={styles.header}>
                        <View style={styles.headerTextContainer}>
                            {title ? <Text style={styles.title}>{title}</Text> : null}
                            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                        </View>

                        <View style={styles.headerActions}>
                            {headerRight}
                            {showCloseButton && (
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.closeButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={20} color="#000" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Content Body */}
                <View style={[styles.body, contentStyle]}>
                    {children}
                </View>
            </Animated.View>
        </View>
    );

    return (
        <RNModal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {avoidKeyboard ? (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardContainer}
                >
                    {modalContent}
                </KeyboardAvoidingView>
            ) : (
                modalContent
            )}
        </RNModal>
    );
}

export default AppModal;

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    overlayBottom: {
        justifyContent: 'flex-end',
    },
    overlayCenter: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
        overflow: 'hidden',
    },
    modalCenter: {
        width: '100%',
        maxWidth: 390,
        borderRadius: 24,
        padding: 22,
        maxHeight: '88%',
    },
    modalBottom: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 22,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '90%',
    },
    handle: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    headerTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
        lineHeight: 18,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        width: '100%',
    },
});
