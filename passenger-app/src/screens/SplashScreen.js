import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animationSequence = Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]);

    animationSequence.start(() => {
      setTimeout(async () => {
        try {
          console.log('[Splash] Animation complete, checking profile...');
          // Verifica se passageiro já está cadastrado usando o método correto
          const StorageService = (await import('../../../shared/services/StorageService')).default;
          console.log('[Splash] StorageService loaded');
          
          // Usa getUserProfile() que verifica @zubi_user_profile
          const userProfile = await StorageService.getUserProfile();
          console.log('[Splash] User profile found:', !!userProfile);
          
          if (userProfile && userProfile.id) {
            console.log('[Splash] User registered, going to Home');
            navigation.replace('Home');
            return;
          }
          
          console.log('[Splash] No user profile, going to Registration');
          navigation.replace('Registration');
        } catch (error) {
          console.error('[Splash] Error during navigation:', error);
          // Fallback: sempre vai para Registration em caso de erro
          navigation.replace('Registration');
        }
      }, 500);
    });
  }, []);

  const spin = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressInterpolation = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.8],
  });

  return (
    <LinearGradient
      colors={['#4CAF50', '#388E3C', '#2E7D32']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#388E3C" />
      
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: logoScale },
                { rotate: spin },
              ],
            },
          ]}
        >
          <Text style={styles.logo}>Z</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.titleContainer,
            { opacity: titleOpacity },
          ]}
        >
          <Text style={styles.title}>Zubi Passageiro</Text>
          <Text style={styles.subtitle}>
            Sua viagem começa aqui
          </Text>
        </Animated.View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressInterpolation },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Carregando motoristas próximos...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>🚗 Protocolo de Mobilidade Cooperativa</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E9',
    textAlign: 'center',
    fontWeight: '300',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: width * 0.8,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  loadingText: {
    color: '#E8F5E9',
    fontSize: 14,
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    color: '#E8F5E9',
    fontSize: 12,
    marginBottom: 4,
  },
  versionText: {
    color: '#C8E6C9',
    fontSize: 10,
  },
});