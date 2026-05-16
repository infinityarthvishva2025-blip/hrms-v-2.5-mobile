import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const PremiumSplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  const loaderAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    // Sequence: Fade in logo -> Hold -> Callback to hide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 1000,
        delay: 400,
        useNativeDriver: true,
      })
    ]).start();

    // Loader animation loop
    Animated.loop(
      Animated.timing(loaderAnim, {
        toValue: 200,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Minimum display time for premium feel
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2000); // 2.5 seconds total

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient
        colors={colors.gradients.primary}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Animated.Image
          source={require('../../../assets/images/infinity-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textAnim }]}>
        <Text style={styles.brandName}>INFINITY HRMS</Text>
        <Text style={styles.tagline}>Intelligent Workforce Solutions</Text>

        <View style={styles.loaderContainer}>
          <Animated.View
            style={[
              styles.loaderBar,
              { transform: [{ translateX: loaderAnim }] }
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  logoContainer: {
    width: width * 0.45,
    height: width * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 15,
  },
  logo: {
    width: '80%',
    height: '80%',
  },
  textContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  loaderContainer: {
    marginTop: 60,
    width: 160,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  loaderBar: {
    height: '100%',
    width: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  }
});

export default PremiumSplashScreen;
