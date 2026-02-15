import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal
} from 'react-native';
import { useP2P } from '../services/P2PService';
import { useApp } from '../../../shared/contexts/AppContext';
import ChatComponent from '../../../shared/components/ChatComponent';

// TODO: Re-implement QR code scanning for presence validation
// The Camera component was removed to fix build issues
// Once build is stable, add back:
// import { CameraView } from 'expo-camera';
// 
// For production:
// 1. Request camera permissions on mount
// 2. Show camera view when validating presence
// 3. Scan QR code from driver's app
// 4. Parse and validate QR data
// 5. Submit validation to P2P network
//
// Current MVP: Uses simulated validation (button click)

export default function TripScreen({ route, navigation }) {
  const { ride } = route.params || {};
  const { activeRide, completeRide } = useApp();
  const { validatePresence, disconnect } = useP2P();
  
  // Use activeRide from context if available, otherwise use route params
  const currentRide = activeRide || ride;
  
  const [tripStatus, setTripStatus] = useState('waiting'); // waiting, ongoing, validating, completed
  const [validations, setValidations] = useState([]);
  const [showChat, setShowChat] = useState(false);

  const handleStartTrip = () => {
    setTripStatus('ongoing');
    Alert.alert(
      'Viagem Iniciada',
      'A viagem começou! Durante o trajeto, você pode validar sua presença (simulado no MVP).'
    );
  };

  const handleValidatePresence = () => {
    // MVP: Simular validação sem scanner real
    // TODO: Replace with actual QR code scanning
    // See implementation notes at top of file
    if (!currentRide) return;
    
    const mockQRData = JSON.stringify({
      driverId: currentRide.driverId,
      tripId: currentRide.id,
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
    if (!currentRide) return;
    
    setTripStatus('validating');

    try {
      // Complete ride in AppContext
      await completeRide(currentRide.id);
      
      setTripStatus('completed');
      
      // Navigate to payment screen
      navigation.navigate('Payment', { ride: currentRide });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao finalizar viagem');
      setTripStatus('ongoing');
    }
  };

  if (!currentRide) {
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
          <Text style={styles.driverName}>{currentRide.driverName || 'Motorista'}</Text>
          <Text style={styles.driverInfo}>{currentRide.driverVehicle || 'Veículo'}</Text>
          <Text style={styles.driverInfo}>Placa: {currentRide.driverPlate || 'N/A'}</Text>
          <View style={styles.driverBadge}>
            <Text style={styles.badgeText}>
              {currentRide.driverLevel || 'Intermediário'} • ⭐ {currentRide.driverRating || '5.0'}
            </Text>
          </View>
        </View>

        <View style={styles.tripCard}>
          <Text style={styles.cardTitle}>Informações da Viagem</Text>
          <View style={styles.tripInfo}>
            <Text style={styles.label}>ID da Viagem:</Text>
            <Text style={styles.value}>{currentRide.id}</Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.label}>Valor estimado:</Text>
            <Text style={styles.value}>R$ {currentRide.estimatedFare?.toFixed(2)}</Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.label}>Distância:</Text>
            <Text style={styles.value}>{currentRide.estimatedDistance?.toFixed(2)} km</Text>
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

            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => setShowChat(true)}
            >
              <Text style={styles.chatButtonText}>💬 Chat com Motorista</Text>
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

      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ChatComponent
          tripId={currentRide.id}
          userType="passenger"
          userName="Passageiro"
          onClose={() => setShowChat(false)}
        />
      </Modal>
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
  chatButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  chatButtonText: {
    color: '#fff',
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
