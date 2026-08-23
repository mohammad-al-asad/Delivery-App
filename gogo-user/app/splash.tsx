import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

export default function SplashScreen() {
    const router = useRouter();
    const logoOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.8);
    const textTranslateY = useSharedValue(20);
    const textOpacity = useSharedValue(0);

    useEffect(() => {
        // Animate Logo
        logoOpacity.value = withTiming(1, { duration: 1000 });
        logoScale.value = withSpring(1);

        // Animate Text with delay
        textOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
        textTranslateY.value = withDelay(500, withSpring(0));

        // Navigate away
        const timer = setTimeout(() => {
            router.replace('/(auth)/sign-in');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }]
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }]
    }));

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.Image
                    source={require('../assets/logo/logo.png')}
                    style={[styles.logo, logoStyle]}
                    resizeMode="contain"
                />
                <Animated.View style={textStyle}>
                    <Animated.Text style={styles.tagline}>Deliver Things Across UAE</Animated.Text>
                    <Animated.Text style={styles.subtagline}>in Minutes!</Animated.Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 24,
    },
    tagline: {
        fontSize: 24,
        fontWeight: '800', // Black
        color: '#2C3E50',
        fontStyle: 'italic',
        textAlign: 'center',
        // fontFamily: Fonts.black // Use system font for now
    },
    subtagline: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2C3E50',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 4,
        // fontFamily: Fonts.black
    },
});
