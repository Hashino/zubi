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
import { useDriver } from '../services/DriverService';

// TODO: Add earnings history view
// TODO: Implement profile editing
// FIX: Add loading states for profile data
// bug: XP progress bar can exceed 100% on high XP

export default function HomeScreen({ navigation }) {
  const { driverProfile } = useDriver();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const getLevelProgress = () => {
    // bug: Next level XP thresholds are hardcoded and inconsistent
    // TODO: Load XP thresholds from smart contract
    // FIX: Handle edge case when XP exceeds maximum level
    const nextLevelXp = driverProfile.level === 'Iniciante' ? 500 : driverProfile.level === 'Intermediário' ? 1000 : 2000;
    return Math.min((driverProfile.xp / nextLevelXp) * 100, 100);
  };

  const getFeePercentage = () => {
    return driverProfile.level === 'Veterano' ? '5%' : driverProfile.level === 'Intermediário' ? '10%' : '15%';
  };

  const getLevelColor = () => {
    return driverProfile.level === 'Veterano' ? '#FFD700' : driverProfile.level === 'Intermediário' ? '#C0C0C0' : '#CD7F32';
  };

  const getLevelEmoji = () => {
    return driverProfile.level === 'Veterano' ? '🥇' : driverProfile.level === 'Intermediário' ? '🥈' : '🥉';
  };

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
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#2196F3', '#1976D2', '#1565C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <Text style={styles.greeting}>Olá, {driverProfile.name}! 👋</Text>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
            <Text style={styles.levelText}>{getLevelEmoji()} {driverProfile.level}</Text>
          </View>
          <Text style={styles.xpText}>{driverProfile.xp} XP</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getLevelProgress()}%` }]} />
          </View>
          <Text style={styles.progressText}>{getLevelProgress().toFixed(0)}% até o próximo nível</Text>
        </LinearGradient>

        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardTitle}>Estatísticas</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🚗 Total de viagens:</Text>
            <Text style={styles.statValue}>{driverProfile.totalTrips}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>⭐ Avaliação:</Text>
            <Text style={styles.statValue}>{driverProfile.rating}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>💰 Ganhos totais:</Text>
            <Text style={[styles.statValue, styles.earningsValue]}>R$ {driverProfile.totalEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.statRowHighlight}>
            <Text style={styles.statLabelHighlight}>Taxa atual:</Text>
            <Text style={styles.feeText}>{getFeePercentage()}</Text>
          </View>
        </View>

        <View style={styles.vehicleCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.cardIcon}>🚙</Text>
            <Text style={styles.cardTitle}>Veículo</Text>
          </View>
          <Text style={styles.vehicleInfo}>{driverProfile.vehicle}</Text>
          <Text style={styles.vehiclePlate}>Placa: {driverProfile.plate}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Como funciona o Zubi?</Text>
          <Text style={styles.infoText}>
            • Conexão P2P direta com passageiros{'\n'}
            • Pagamentos via smart contracts{'\n'}
            • Taxas progressivas baseadas em XP{'\n'}
            • Governança descentralizada{'\n'}
            • Trabalho de oráculo para XP extra
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              handlePressOut();
              navigation.navigate('Online');
            }}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>🟢 Ficar Online</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Protocolo de Mobilidade Cooperativa Descentralizada
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
  profileCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  levelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  xpText: {
    color: '#E3F2FD',
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  progressText: {
    color: '#E3F2FD',
    fontSize: 12,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statLabelHighlight: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  earningsValue: {
    color: '#4CAF50',
    fontSize: 16,
  },
  feeText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 22,
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
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
