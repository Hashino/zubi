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
import QRCode from 'react-native-qrcode-svg';
import { useDriver } from '../services/DriverService';
import ChatComponent from '../shared/components/ChatComponent';

// TODO: Add navigation integration (Google Maps / Waze)
// TODO: Implement real-time ETA updates
// FIX: Add trip cancellation flow
// warn: No validation counting mechanism - validationCount is never incremented
// bug: QR code doesn't refresh periodically (security issue)

export default function TripScreen({ navigation }) {
  const { activeTrip, driverProfile, generatePresenceQRCode, finishTrip } = useDriver();
  const [tripStatus, setTripStatus] = useState('going_to_passenger'); // going_to_passenger, in_progress, finishing
  const [qrData, setQrData] = useState(null);
  const [validationCount, setValidationCount] = useState(0);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // TODO: Regenerate QR code every 30 seconds for security
    // FIX: Clean up interval on component unmount
    if (activeTrip) {
      const data = generatePresenceQRCode();
      setQrData(data);
    }
  }, [activeTrip]);

  const handleStartTrip = () => {
    Alert.alert(
      'Iniciar Viagem',
      'Confirma que o passageiro entrou no veículo?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: () => {
            setTripStatus('in_progress');
            Alert.alert(
              'Viagem Iniciada',
              'Durante o trajeto, o passageiro deverá escanear seu QR Code para validar a presença.'
            );
          }
        }
      ]
    );
  };

  const handleFinishTrip = () => {
    Alert.alert(
      'Finalizar Viagem',
      `Confirma que chegou ao destino?\n\nValor: R$ ${activeTrip.estimatedFare}\nValidações: ${validationCount}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setTripStatus('finishing');
            const result = await finishTrip({
              tripId: activeTrip.tripId,
              fare: activeTrip.estimatedFare,
              validations: validationCount
            });

            if (result.success) {
              Alert.alert(
                'Viagem Finalizada',
                `Pagamento recebido!\n\n` +
                `Valor bruto: R$ ${activeTrip.estimatedFare}\n` +
                `Taxa: R$ ${result.fee.toFixed(2)}\n` +
                `Seu ganho: R$ ${result.earning.toFixed(2)}\n\n` +
                `+10 XP ganhos!\nXP total: ${result.newXp}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Home')
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  if (!activeTrip) {
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
            {tripStatus === 'going_to_passenger' && '🚗 Indo buscar passageiro'}
            {tripStatus === 'in_progress' && '🛣️ Viagem em andamento'}
            {tripStatus === 'finishing' && '⏳ Finalizando...'}
          </Text>
        </View>

        <View style={styles.passengerCard}>
          <Text style={styles.cardTitle}>Passageiro</Text>
          <Text style={styles.passengerName}>{activeTrip.passengerName}</Text>
          <Text style={styles.passengerRating}>⭐ {activeTrip.passengerRating}</Text>
        </View>

        <View style={styles.tripCard}>
          <Text style={styles.cardTitle}>Detalhes da Viagem</Text>
          
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>📍 Origem</Text>
            <Text style={styles.locationAddress}>{activeTrip.origin.address}</Text>
          </View>

          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>🎯 Destino</Text>
            <Text style={styles.locationAddress}>{activeTrip.destination.address}</Text>
          </View>

          <View style={styles.fareInfo}>
            <Text style={styles.fareLabel}>Valor:</Text>
            <Text style={styles.fareValue}>R$ {activeTrip.estimatedFare}</Text>
          </View>

          <View style={styles.feeInfo}>
            <Text style={styles.feeLabel}>Taxa ({driverProfile.level === 'Veterano' ? '5%' : driverProfile.level === 'Intermediário' ? '10%' : '15%'}):</Text>
            <Text style={styles.feeValue}>
              R$ {(parseFloat(activeTrip.estimatedFare) * (driverProfile.level === 'Veterano' ? 0.05 : driverProfile.level === 'Intermediário' ? 0.10 : 0.15)).toFixed(2)}
            </Text>
          </View>

          <View style={styles.earningInfo}>
            <Text style={styles.earningLabel}>Seu ganho:</Text>
            <Text style={styles.earningValue}>
              R$ {(parseFloat(activeTrip.estimatedFare) - (parseFloat(activeTrip.estimatedFare) * (driverProfile.level === 'Veterano' ? 0.05 : driverProfile.level === 'Intermediário' ? 0.10 : 0.15))).toFixed(2)}
            </Text>
          </View>
        </View>

        {tripStatus !== 'finishing' && (
          <View style={styles.qrCard}>
            <Text style={styles.cardTitle}>QR Code de Validação</Text>
            <Text style={styles.qrText}>
              O passageiro deve escanear este código durante a viagem
            </Text>
            <View style={styles.qrContainer}>
              {qrData && <QRCode value={qrData} size={200} />}
            </View>
            <Text style={styles.validationText}>
              Validações realizadas: {validationCount}
            </Text>
          </View>
        )}

        {tripStatus === 'going_to_passenger' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartTrip}
          >
            <Text style={styles.buttonText}>Passageiro Embarcou</Text>
          </TouchableOpacity>
        )}

        {tripStatus === 'in_progress' && (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishTrip}
          >
            <Text style={styles.buttonText}>Finalizar Viagem</Text>
          </TouchableOpacity>
        )}

        {tripStatus !== 'finishing' && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => setShowChat(true)}
          >
            <Text style={styles.chatButtonText}>💬 Chat com Passageiro</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Importante</Text>
          <Text style={styles.infoText}>
            • Peça ao passageiro para escanear o QR Code{'\n'}
            • As validações aumentam a confiança na rede{'\n'}
            • O pagamento será processado via smart contract{'\n'}
            • Você ganhará 10 XP por esta viagem
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ChatComponent
          tripId={activeTrip?.tripId}
          userType="driver"
          userName={driverProfile.name}
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
    backgroundColor: '#2196F3',
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
  passengerCard: {
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
  passengerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  passengerRating: {
    fontSize: 16,
    color: '#FFA000',
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
  },
  fareInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
  },
  feeValue: {
    fontSize: 14,
    color: '#f44336',
  },
  earningInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  earningLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  earningValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  validationText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  finishButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
