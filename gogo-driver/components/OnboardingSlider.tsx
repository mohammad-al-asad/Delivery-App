import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const SLIDES = [
    {
        id: "1",
        emoji: "🚗",
        title: "Earn on Your Schedule",
        description: "Drive when you want, where you want. You're in control of your earnings.",
    },
    {
        id: "2",
        emoji: "💰",
        title: "Track Every Earning",
        description: "Track cash received and pending earnings while weekly settlements are marked by admin.",
    },
    {
        id: "3",
        emoji: "🗺️",
        title: "Navigate with Ease",
        description: "Built-in GPS navigation helps you find the fastest routes.",
    },
];

export const OnboardingSlider = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [sliderWidth, setSliderWidth] = useState(width);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: any) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        if (sliderWidth > 0) {
            const slideIndex = Math.round(scrollPosition / sliderWidth);
            if (
                slideIndex !== activeSlide &&
                slideIndex >= 0 &&
                slideIndex < SLIDES.length
            ) {
                setActiveSlide(slideIndex);
            }
        }
    };

    useEffect(() => {
        const autoPlayTimer = setInterval(() => {
            setActiveSlide((prev) => {
                const nextSlide = (prev + 1) % SLIDES.length;
                flatListRef.current?.scrollToIndex({
                    index: nextSlide,
                    animated: true,
                });
                return nextSlide;
            });
        }, 4000);

        return () => clearInterval(autoPlayTimer);
    }, []);

    return (
        <Animated.View
            entering={FadeInUp.delay(400).duration(800)}
            style={[styles.sliderContainer, { width: sliderWidth }]}
            onLayout={(event) => {
                const layoutWidth = event.nativeEvent.layout.width;
                if (layoutWidth > 0) {
                    setSliderWidth(layoutWidth);
                }
            }}
        >
            <FlatList
                ref={flatListRef}
                style={styles.list}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                bounces={false}
                keyExtractor={(item) => item.id}
                getItemLayout={(_data, index) => ({
                    length: sliderWidth,
                    offset: sliderWidth * index,
                    index,
                })}
                renderItem={({ item }) => (
                    <View style={[styles.slide, { width: sliderWidth }]}>
                        <Animated.Text style={styles.emoji}>{item.emoji}</Animated.Text>
                        <Animated.Text style={styles.title}>{item.title}</Animated.Text>
                        <Animated.Text style={styles.description}>
                            {item.description}
                        </Animated.Text>
                    </View>
                )}
            />
            <View style={styles.pagination}>
                {SLIDES.map((_, index) => (
                    <View
                        key={index}
                        style={[styles.dot, activeSlide === index && styles.dotActive]}
                    />
                ))}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sliderContainer: {
        height: height * 0.45,
        width: "100%",
        position: "relative",
    },
    list: {
        flex: 1,
    },
    slide: {
        width,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1A202C",
        textAlign: "center",
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: "#718096",
        textAlign: "center",
        lineHeight: 22,
    },
    pagination: {
        flexDirection: "row",
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#E2E8F0",
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: "#0047E0",
        width: 24,
    },
});
