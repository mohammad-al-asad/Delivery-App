import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  { id: "1", image: require("@/assets/quick.png") },
  { id: "2", image: require("@/assets/secure.png") },
  { id: "3", image: require("@/assets/vehicles/bike.png") },
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
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: nextSlide,
            animated: true,
          });
        }
        return nextSlide;
      });
    }, 3000);

    return () => clearInterval(autoPlayTimer);
  }, [sliderWidth]);

  return (
    <Animated.View
      entering={FadeInUp.delay(400).duration(800)}
      style={[styles.sliderContainer, { width: sliderWidth }]}
      onLayout={(e) => {
        const layoutWidth = e.nativeEvent.layout.width;
        if (layoutWidth > 0) {
          setSliderWidth(layoutWidth);
        }
      }}
    >
      <FlatList
        ref={flatListRef}
        style={{ flex: 1 }}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(data, index) => ({
          length: sliderWidth,
          offset: sliderWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: sliderWidth }]}>
            <Image
              source={item.image}
              style={styles.slideImage}
              resizeMode="contain"
            />
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
  slide: {
    width,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  slideImage: {
    width: 300,
    height: 300,
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#0047E0",
    width: 24,
  },
});
