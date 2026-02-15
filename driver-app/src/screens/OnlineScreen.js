import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { useDriver } from '../services/DriverService';
import NostrService from '../../../shared/services/NostrService';

/**
 * OnlineScreen - Nova versão: Motorista vê corridas disponíveis e se candidata
 * 
 * Fluxo:
 * 1. Motorista fica online
 * 2. Subscreve a ride-requests no Nostr
 * 3. Vê lista de corridas disponíveis
 * 4. Escolhe se candidatar para uma corrida
 * 5. Aguarda passageiro aceitar
 * 6. Se aceito, navega para TripScreen
 */
export default function OnlineScreen({ navigation }) {
  const { driverProfile, isOnline, goOnline, goOffline, setCurrentLocation } = useDriver();

  const [location, setLocation] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [candidacies, setCandidacies] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setupOnline();
    
    return () => {
      // Cleanup subscriptions
      NostrService.unsubscribe('ride-requests');
      NostrService.unsubscribe(`acceptance-${driverProfile?.id}`);
    };
  }, []);

  const setupOnline = async () => {
    try {
      // Obter localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização negada');
        navigation.goBack();
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setCurrentLocation(currentLocation.coords);

      // Ficar online
      if (!isOnline) {
        const success = await goOnline(currentLocation.coords);
        if (!success) {
          Alert.alert('Erro', 'Não foi possível ficar online');
          navigation.goBack();
          return;
        }
      }

      // Subscrever a ride requests no Nostr
      console.log('[OnlineScreen] Subscribing to ride requests...');
      await NostrService.subscribeToRideRequests(currentLocation.coords, (rideRequest) => {
        console.log('[OnlineScreen] New ride request:', rideRequest.rideId);
        
        // Calcular distância
        const distance = calculateDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          rideRequest.origin.latitude,
          rideRequest.origin.longitude
        );

        setRideRequests(prev => {
          // Evitar duplicatas
          if (prev.find(r => r.rideId === rideRequest.rideId)) {
            return prev;
          }
          return [...prev, { ...rideRequest, distance }];
        });
      });

      // Subscrever a aceitações de passageiros
      await NostrService.subscribeToAcceptance(driverProfile.id, (acceptance) => {
        console.log('[OnlineScreen] Driver accepted by passenger!', acceptance);
        
        Alert.alert(
          'Corrida Confirmada! 🎉',
          'O passageiro aceitou você! Iniciando corrida...',
          [
            {
              text: 'OK',
              onPress: () => {
                // TODO: Navegar para TripScreen com dados da corrida
                navigation.navigate('Trip', { rideId: acceptance.rideId });
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('[OnlineScreen] Setup error:', error);
      Alert.alert('Erro', 'Erro ao configurar modo online');
      navigation.goBack();
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const handleCandidateForRide = async (rideRequest) => {
    if (candidacies.has(rideRequest.rideId)) {
      Alert.alert('Atenção', 'Você já se candidatou para esta corrida');
      return;
    }

    const estimatedArrival = Math.ceil(rideRequest.distance * 3); // ~3 min per km

    Alert.alert(
      'Candidatar-se à Corrida',
      `Passageiro: ${rideRequest.passengerName}\n` +
      `De: ${rideRequest.origin.address}\n` +
      `Para: ${rideRequest.destination.address}\n\n` +
      `Distância até origem: ${rideRequest.distance.toFixed(1)} km\n` +
      `Chegada estimada: ${estimatedArrival} min\n` +
      `Valor estimado: R$ ${rideRequest.estimatedFare.toFixed(2)}\n\n` +
      `Deseja se candidatar?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, candidatar',
          onPress: async () => {
            try {
              console.log('[OnlineScreen] Publishing candidacy...');
              
              const result = await NostrService.publishDriverCandidacy(rideRequest.rideId, {
                driverId: driverProfile.id,
                driverName: driverProfile.name,
                vehicle: driverProfile.vehicle,
                plate: driverProfile.plate,
                rating: driverProfile.rating,
                level: driverProfile.level,
                location: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                },
                estimatedArrival,
              });

              if (result.success) {
                setCandidacies(prev => new Set([...prev, rideRequest.rideId]));
                Alert.alert(
                  'Candidatura Enviada!',
                  'Aguarde o passageiro aceitar sua candidatura.'
                );
              } else {
                Alert.alert('Erro', 'Não foi possível enviar candidatura');
              }
            } catch (error) {
              console.error('[OnlineScreen] Candidacy error:', error);
              Alert.alert('Erro', 'Erro ao enviar candidatura');
            }
          }
        }
      ]
    );
  };

  const handleGoOffline = () => {
    Alert.alert(
      'Ficar Offline',
      'Deseja parar de receber solicitações?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await goOffline();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Re-fetch ride requests
    setRefreshing(false);
  };

  const renderRideRequest = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.requestCard,
        candidacies.has(item.rideId) && styles.requestCardCandidated
      ]}
      onPress={() => handleCandidateForRide(item)}
    >
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.passengerName}>{item.passengerName}</Text>
          <Text style={styles.passengerRating}>⭐ {item.passengerRating}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>🔵</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {item.origin.address}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>🔴</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {item.destination.address}
          </Text>
        </View>
      </View>

      <View style={styles.requestFooter}>
        <View style={styles.fareInfo}>
          <Text style={styles.fareLabel}>Valor estimado:</Text>
          <Text style={styles.fareValue}>R$ {item.estimatedFare.toFixed(2)}</Text>
        </View>
        <Text style={styles.distanceInfo}>
          📏 {item.estimatedDistance.toFixed(1)} km
        </Text>
      </View>

      {candidacies.has(item.rideId) ? (
        <View style={styles.candidatedButton}>
          <Text style={styles.candidatedButtonText}>✓ Candidatura Enviada</Text>
        </View>
      ) : (
        <View style={styles.candidateButton}>
          <Text style={styles.candidateButtonText}>Me Candidatar</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusText}>Online</Text>
        </View>
        <TouchableOpacity
          style={styles.offlineButton}
          onPress={handleGoOffline}
        >
          <Text style={styles.offlineButtonText}>Ficar Offline</Text>
        </TouchableOpacity>
      </View>

      {/* Driver Info */}
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{driverProfile?.name}</Text>
        <Text style={styles.driverLevel}>
          {driverProfile?.level} • Taxa: {
            driverProfile?.level === 'Veterano' ? '5%' :
            driverProfile?.level === 'Intermediário' ? '10%' : '15%'
          }
        </Text>
        <Text style={styles.locationText}>
          📍 {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Obtendo localização...'}
        </Text>
      </View>

      {/* Ride Requests */}
      <View style={styles.requestsContainer}>
        <View style={styles.requestsHeader}>
          <Text style={styles.requestsTitle}>
            Corridas Disponíveis ({rideRequests.length})
          </Text>
        </View>
        
        {rideRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              Nenhuma corrida disponível no momento
            </Text>
            <Text style={styles.emptySubtext}>
              Aguardando solicitações via rede P2P Nostr
            </Text>
          </View>
        ) : (
          <FlatList
            data={rideRequests}
            renderItem={renderRideRequest}
            keyExtractor={item => item.rideId}
            contentContainerStyle={styles.requestsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  offlineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  driverInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  driverLevel: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  requestsContainer: {
    flex: 1,
  },
  requestsHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestCardCandidated: {
    borderColor: '#FFA000',
    backgroundColor: '#FFF9E6',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  passengerRating: {
    fontSize: 14,
    color: '#FFA000',
  },
  distanceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  routeContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 12,
  },
  fareInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  fareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  distanceInfo: {
    fontSize: 14,
    color: '#666',
  },
  candidateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  candidateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  candidatedButton: {
    backgroundColor: '#FFA000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  candidatedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
