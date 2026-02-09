import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// TODO: Add user authentication and profile management
// TODO: Add wallet connection (MetaMask or WalletConnect)
// FIX: Add loading states and error handling

export default function HomeScreen({ navigation }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#388E3C" />
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#4CAF50', '#388E3C', '#2E7D32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.logoEmoji}>🚗</Text>
          <Text style={styles.title}>Zubi</Text>
          <Text style={styles.subtitle}>
            Mobilidade Cooperativa Descentralizada
          </Text>
        </LinearGradient>

        <View style={styles.infoCard}>
          <View style={styles.iconHeader}>
            <Text style={styles.cardIcon}>💡</Text>
            <Text style={styles.infoTitle}>Como funciona?</Text>
          </View>
          <Text style={styles.infoText}>
            • Sem intermediários centralizados{'\n'}
            • Conexão P2P direta com motoristas{'\n'}
            • Pagamento via smart contracts{'\n'}
            • Validação de presença por QR Code{'\n'}
            • Taxas reduzidas e transparentes
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.iconHeader}>
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={styles.infoTitle}>Taxas por nível do motorista</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥉 Iniciante (0-500 XP)</Text>
            <Text style={styles.feePercent}>15%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥈 Intermediário (500-1000 XP)</Text>
            <Text style={styles.feePercent}>10%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥇 Veterano (1000+ XP)</Text>
            <Text style={[styles.feePercent, styles.feeHighlight]}>5%</Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              handlePressOut();
              navigation.navigate('Search');
            }}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>🔍 Buscar Motorista</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Protocolo de Mobilidade Cooperativa Descentralizada (PMCD)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#E8F5E9',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feeLevel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  feePercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  feeHighlight: {
    color: '#4CAF50',
    fontSize: 18,
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.7,
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});
