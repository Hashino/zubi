import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { useP2P } from '../services/P2PService';

export default function TripScreen({ route, navigation }) {
  const { driver, tripId } = route.params;
  const { validatePresence, finalizeTripPayment, disconnect } = useP2P();
  const [tripStatus, setTripStatus] = useState('waiting'); // waiting, ongoing, validating, completed
  const [validations, setValidations] = useState([]);
  const [fare] = useState((Math.random() * 20 + 10).toFixed(2)); // Mock fare

  const handleStartTrip = () => {
    setTripStatus('ongoing');
    Alert.alert(
      'Viagem Iniciada',
      'A viagem começou! Durante o trajeto, você pode validar sua presença (simulado no MVP).'
    );
  };

  const handleValidatePresence = () => {
    // Simular validação sem scanner real
    const mockQRData = JSON.stringify({
      driverId: driver.id,
      tripId: tripId,
      timestamp: Date.now()
    });
    
    const validation = validatePresence(mockQRData);
    
    if (validation.valid) {
      setValidations([...validations, validation]);
      Alert.alert(
        'Validação Simulada',
        'Presença confirmada! Em produção, você escanearia o QR Code do motorista.'
      );
    }
  };

  const handleFinishTrip = async () => {
    if (validations.length === 0) {
      Alert.alert(
        'Atenção',
        'Nenhuma validação de presença foi realizada. Deseja continuar mesmo assim?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => processFinishTrip() }
        ]
      );
    } else {
      processFinishTrip();
    }
  };

  const processFinishTrip = async () => {
    setTripStatus('validating');

    try {
      const result = await finalizeTripPayment({
        tripId,
        driverId: driver.id,
        fare: parseFloat(fare),
        validations
      });

      if (result.success) {
        setTripStatus('completed');
        Alert.alert(
          'Viagem Finalizada',
          `Pagamento processado com sucesso!\n\n` +
          `Valor: R$ ${fare}\n` +
          `Taxa (${driver.level === 'Veterano' ? '5%' : driver.level === 'Intermediário' ? '10%' : '15%'}): R$ ${result.transaction.fee.toFixed(2)}\n` +
          `Total: R$ ${(parseFloat(fare) + result.transaction.fee).toFixed(2)}\n\n` +
          `TX Hash: ${result.blockchainTxHash.substring(0, 20)}...`,
          [
            {
              text: 'OK',
              onPress: () => {
                disconnect();
                navigation.navigate('Home');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar pagamento');
      setTripStatus('ongoing');
    }
  };

  const handleValidatePresence = () => {
    // Simular validação sem scanner real
    const mockQRData = JSON.stringify({
      driverId: driver.id,
      tripId: tripId,
      timestamp: Date.now()
    });
    
    const validation = validatePresence(mockQRData);
    
    if (validation.valid) {
      setValidations([...validations, validation]);
      Alert.alert(
        'Validação Simulada',
        'Presença confirmada! Em produção, você escanearia o QR Code do motorista.'
      );
    }
  };

  if (!driver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Nenhuma viagem ativa</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            {tripStatus === 'waiting' && '⏳ Aguardando início'}
            {tripStatus === 'ongoing' && '🚗 Em viagem'}
            {tripStatus === 'validating' && '⏳ Processando...'}
            {tripStatus === 'completed' && '✅ Concluída'}
          </Text>
        </View>

        <View style={styles.driverCard}>
          <Text style={styles.cardTitle}>Motorista</Text>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverInfo}>{driver.vehicle}</Text>
          <Text style={styles.driverInfo}>Placa: {driver.plate}</Text>
          <View style={styles.driverBadge}>
            <Text style={styles.badgeText}>
              {driver.level} • {driver.xp} XP • ⭐ {driver.rating}
            </Text>
          </View>
        </View>

        <View style={styles.tripCard}>
          <Text style={styles.cardTitle}>Informações da Viagem</Text>
          <View style={styles.tripInfo}>
            <Text style={styles.label}>ID da Viagem:</Text>
            <Text style={styles.value}>{tripId}</Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.label}>Valor estimado:</Text>
            <Text style={styles.value}>R$ {fare}</Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.label}>Taxa ({driver.level === 'Veterano' ? '5%' : driver.level === 'Intermediário' ? '10%' : '15%'}):</Text>
            <Text style={styles.value}>
              R$ {(parseFloat(fare) * (driver.level === 'Veterano' ? 0.05 : driver.level === 'Intermediário' ? 0.10 : 0.15)).toFixed(2)}
            </Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.label}>Validações:</Text>
            <Text style={styles.value}>{validations.length}</Text>
          </View>
        </View>

        {tripStatus === 'waiting' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartTrip}
          >
            <Text style={styles.buttonText}>Iniciar Viagem</Text>
          </TouchableOpacity>
        )}

        {tripStatus === 'ongoing' && (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleValidatePresence}
            >
              <Text style={styles.buttonText}>✓ Validar Presença (Simulado)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleFinishTrip}
            >
              <Text style={styles.secondaryButtonText}>Finalizar Viagem</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Como funciona?</Text>
          <Text style={styles.infoText}>
            1. Inicie a viagem quando entrar no veículo{'\n'}
            2. Durante o trajeto, valide sua presença (simulado no MVP){'\n'}
            3. Ao chegar no destino, finalize a viagem{'\n'}
            4. O pagamento será processado via smart contract
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
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  driverCard: {
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
  tripCard: {
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
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  driverInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  driverBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  badgeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
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
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scannerText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
