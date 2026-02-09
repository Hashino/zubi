import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import { useDriver } from '../services/DriverService';

// TODO: Add earnings history view
// TODO: Implement profile editing
// FIX: Add loading states for profile data
// bug: XP progress bar can exceed 100% on high XP

export default function HomeScreen({ navigation }) {
  const { driverProfile } = useDriver();

  const getLevelProgress = () => {
    // bug: Next level XP thresholds are hardcoded and inconsistent
    // TODO: Load XP thresholds from smart contract
    // FIX: Handle edge case when XP exceeds maximum level
    const nextLevelXp = driverProfile.level === 'Iniciante' ? 500 : driverProfile.level === 'Intermediário' ? 1000 : 2000;
    return (driverProfile.xp / nextLevelXp) * 100;
  };

  const getFeePercentage = () => {
    return driverProfile.level === 'Veterano' ? '5%' : driverProfile.level === 'Intermediário' ? '10%' : '15%';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.greeting}>Olá, {driverProfile.name}!</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{driverProfile.level}</Text>
          </View>
          <Text style={styles.xpText}>{driverProfile.xp} XP</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getLevelProgress()}%` }]} />
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estatísticas</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total de viagens:</Text>
            <Text style={styles.statValue}>{driverProfile.totalTrips}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avaliação:</Text>
            <Text style={styles.statValue}>⭐ {driverProfile.rating}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Ganhos totais:</Text>
            <Text style={styles.statValue}>R$ {driverProfile.totalEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Taxa atual:</Text>
            <Text style={[styles.statValue, styles.feeText]}>{getFeePercentage()}</Text>
          </View>
        </View>

        <View style={styles.vehicleCard}>
          <Text style={styles.cardTitle}>Veículo</Text>
          <Text style={styles.vehicleInfo}>{driverProfile.vehicle}</Text>
          <Text style={styles.vehiclePlate}>Placa: {driverProfile.plate}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Como funciona o Zubi?</Text>
          <Text style={styles.infoText}>
            • Conexão P2P direta com passageiros{'\n'}
            • Pagamentos via smart contracts{'\n'}
            • Taxas progressivas baseadas em XP{'\n'}
            • Governança descentralizada{'\n'}
            • Trabalho de oráculo para XP extra
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Online')}
        >
          <Text style={styles.buttonText}>Ficar Online</Text>
        </TouchableOpacity>

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
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  levelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  xpText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  feeText: {
    color: '#4CAF50',
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
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});
