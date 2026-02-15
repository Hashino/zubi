import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import NostrService from '../../../shared/services/NostrService';

/**
 * RideWaitingScreen - Tela de espera enquanto motoristas se candidatam
 * 
 * Fluxo:
 * 1. Passageiro publica solicitação de corrida no Nostr
 * 2. Motoristas veem a solicitação e se candidatam
 * 3. Candidaturas aparecem em tempo real nesta tela
 * 4. Passageiro escolhe e aceita um motorista
 * 5. Navegação para TripScreen
 */
export default function RideWaitingScreen({ route, navigation }) {
  const { rideRequest } = route.params;
  
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    setupRideRequest();
    startPulseAnimation();
    
    return () => {
      // Cleanup subscription
      NostrService.unsubscribe(`candidates-${rideRequest.rideId}`);
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const setupRideRequest = async () => {
    try {
      console.log('[RideWaitingScreen] Setting up ride request:', rideRequest.rideId);
      
      // Publica a solicitação de corrida no Nostr
      const publishResult = await NostrService.publishRideRequest(rideRequest);
      
      if (!publishResult.success) {
        Alert.alert('Erro', 'Não foi possível publicar a solicitação de corrida');
        navigation.goBack();
        return;
      }

      console.log('[RideWaitingScreen] Ride request published, subscribing to candidates...');

      // Subscreve a candidaturas em tempo real
      await NostrService.subscribeToCandidates(rideRequest.rideId, (candidate) => {
        console.log('[RideWaitingScreen] New candidate received:', candidate.driverName);
        
        setCandidates(prev => {
          // Evita duplicatas
          if (prev.find(c => c.driverId === candidate.driverId)) {
            return prev;
          }
          return [...prev, candidate];
        });
      });

      // Busca candidatos existentes (caso já existam)
      const existingResult = await NostrService.getRideCandidates(rideRequest.rideId);
      if (existingResult.success && existingResult.candidates.length > 0) {
        console.log('[RideWaitingScreen] Found existing candidates:', existingResult.candidates.length);
        setCandidates(existingResult.candidates);
      }

      setLoading(false);
    } catch (error) {
      console.error('[RideWaitingScreen] Setup error:', error);
      Alert.alert('Erro', 'Erro ao configurar solicitação de corrida');
      navigation.goBack();
    }
  };

  const handleAcceptDriver = async (candidate) => {
    Alert.alert(
      'Confirmar Motorista',
      `Aceitar ${candidate.driverName}?\n\n` +
      `Veículo: ${candidate.vehicle}\n` +
      `Placa: ${candidate.plate}\n` +
      `Avaliação: ${candidate.rating} ⭐\n` +
      `Nível: ${candidate.level}\n` +
      `Chegada estimada: ${candidate.estimatedArrival} min\n` +
      `Taxa: ${getFeeText(candidate.level)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Publica aceitação no Nostr
              const result = await NostrService.publishDriverAcceptance(
                rideRequest.rideId,
                candidate.driverId
              );

              if (result.success) {
                console.log('[RideWaitingScreen] Driver accepted, navigating to Trip...');
                
                // Navega para tela de corrida
                navigation.replace('Trip', {
                  ride: {
                    ...rideRequest,
                    driverId: candidate.driverId,
                    driverName: candidate.driverName,
                    driverVehicle: candidate.vehicle,
                    driverPlate: candidate.plate,
                    driverRating: candidate.rating,
                    driverLevel: candidate.level,
                    driverLocation: candidate.location,
                    status: 'MATCHED',
                  },
                });
              } else {
                Alert.alert('Erro', 'Não foi possível aceitar o motorista');
              }
            } catch (error) {
              console.error('[RideWaitingScreen] Accept error:', error);
              Alert.alert('Erro', 'Erro ao aceitar motorista');
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Corrida',
      'Deseja realmente cancelar esta solicitação?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: () => {
            // TODO: Publicar cancelamento no Nostr
            navigation.goBack();
          }
        }
      ]
    );
  };

  const getFeeText = (level) => {
    if (level === 'Veterano') return '5%';
    if (level === 'Intermediário') return '10%';
    return '15%';
  };

  const getFeeColor = (level) => {
    if (level === 'Veterano') return '#4CAF50';
    if (level === 'Intermediário') return '#FF9800';
    return '#F44336';
  };

  const renderCandidate = ({ item }) => (
    <TouchableOpacity
      style={styles.candidateCard}
      onPress={() => handleAcceptDriver(item)}
    >
      <View style={styles.candidateHeader}>
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>{item.driverName}</Text>
          <Text style={styles.candidateRating}>⭐ {item.rating}</Text>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: getFeeColor(item.level) }]}>
          <Text style={styles.levelText}>{item.level}</Text>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleText}>🚗 {item.vehicle}</Text>
        <Text style={styles.plateText}>Placa: {item.plate}</Text>
      </View>

      <View style={styles.candidateFooter}>
        <View style={styles.arrivalInfo}>
          <Text style={styles.arrivalIcon}>⏱️</Text>
          <Text style={styles.arrivalText}>{item.estimatedArrival} min</Text>
        </View>
        <Text style={[styles.feeText, { color: getFeeColor(item.level) }]}>
          Taxa: {getFeeText(item.level)}
        </Text>
      </View>

      <View style={styles.acceptButton}>
        <Text style={styles.acceptButtonText}>Aceitar Motorista</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>✕ Cancelar</Text>
        </TouchableOpacity>
      </View>

      {/* Ride Info */}
      <View style={styles.rideInfo}>
        <Text style={styles.title}>Procurando Motorista</Text>
        <View style={styles.routeInfo}>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>🔵</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {rideRequest.origin.address}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>🔴</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {rideRequest.destination.address}
            </Text>
          </View>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Valor estimado:</Text>
          <Text style={styles.fareValue}>R$ {rideRequest.estimatedFare.toFixed(2)}</Text>
        </View>
      </View>

      {/* Candidates Section */}
      <View style={styles.candidatesSection}>
        <View style={styles.candidatesHeader}>
          <Text style={styles.candidatesTitle}>
            Motoristas Disponíveis ({candidates.length})
          </Text>
          {loading && <ActivityIndicator size="small" color="#4CAF50" />}
        </View>

        {candidates.length === 0 ? (
          <View style={styles.waitingContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.waitingIcon}>🔍</Text>
            </Animated.View>
            <Text style={styles.waitingText}>
              Aguardando motoristas se candidatarem...
            </Text>
            <Text style={styles.waitingSubtext}>
              Sua solicitação está visível para motoristas próximos via rede P2P
            </Text>
            <View style={styles.distanceInfo}>
              <Text style={styles.distanceText}>
                📏 {rideRequest.estimatedDistance.toFixed(1)} km
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={candidates}
            renderItem={renderCandidate}
            keyExtractor={item => item.driverId}
            contentContainerStyle={styles.candidatesList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rideInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  routeInfo: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  fareLabel: {
    fontSize: 16,
    color: '#666',
  },
  fareValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  candidatesSection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  candidatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  candidatesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  waitingIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  waitingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  distanceInfo: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  distanceText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  candidatesList: {
    paddingBottom: 16,
  },
  candidateCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  candidateRating: {
    fontSize: 14,
    color: '#FFA000',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    marginBottom: 12,
  },
  vehicleText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  plateText: {
    fontSize: 14,
    color: '#666',
  },
  candidateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 12,
  },
  arrivalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrivalIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  arrivalText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  feeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
