import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  FlatList
} from 'react-native';
import * as Location from 'expo-location';
import { useDriver } from '../services/DriverService';

// warn: No continuous location tracking while online
// TODO: Implement background location updates
// TODO: Add map view showing driver's current location
// FIX: Add battery optimization handling
// bug: Going offline doesn't clean up location watchers

export default function OnlineScreen({ navigation }) {
  const {
    driverProfile,
    isOnline,
    tripRequests,
    goOnline,
    goOffline,
    acceptTripRequest,
    rejectTripRequest,
    setCurrentLocation
  } = useDriver();

  const [location, setLocation] = useState(null);

  useEffect(() => {
    setupLocation();
  }, []);

  const setupLocation = async () => {
    // TODO: Request background location permission
    // FIX: Add error recovery for denied permissions
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização negada');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setCurrentLocation(currentLocation.coords);
      
      if (!isOnline) {
        goOnline(currentLocation.coords);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter localização');
    }
  };

  const handleGoOffline = () => {
    Alert.alert(
      'Ficar Offline',
      'Deseja parar de receber solicitações?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            goOffline();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleAcceptTrip = (requestId) => {
    const request = tripRequests.find(r => r.id === requestId);
    Alert.alert(
      'Aceitar Viagem',
      `Passageiro: ${request.passengerName}\n` +
      `Origem: ${request.origin.address}\n` +
      `Destino: ${request.destination.address}\n` +
      `Valor estimado: R$ ${request.estimatedFare}`,
      [
        { text: 'Recusar', style: 'cancel', onPress: () => rejectTripRequest(requestId) },
        {
          text: 'Aceitar',
          onPress: () => {
            const accepted = acceptTripRequest(requestId);
            if (accepted) {
              navigation.navigate('Trip');
            }
          }
        }
      ]
    );
  };

  const renderTripRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.passengerName}>{item.passengerName}</Text>
        <Text style={styles.passengerRating}>⭐ {item.passengerRating}</Text>
      </View>

      <View style={styles.requestInfo}>
        <Text style={styles.label}>Origem:</Text>
        <Text style={styles.address}>{item.origin.address}</Text>
      </View>

      <View style={styles.requestInfo}>
        <Text style={styles.label}>Destino:</Text>
        <Text style={styles.address}>{item.destination.address}</Text>
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>Valor estimado:</Text>
        <Text style={styles.fareValue}>R$ {item.estimatedFare}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => rejectTripRequest(item.id)}
        >
          <Text style={styles.rejectButtonText}>Recusar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptTrip(item.id)}
        >
          <Text style={styles.acceptButtonText}>Aceitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{driverProfile.name}</Text>
        <Text style={styles.driverLevel}>{driverProfile.level} • Taxa: {driverProfile.level === 'Veterano' ? '5%' : driverProfile.level === 'Intermediário' ? '10%' : '15%'}</Text>
        <Text style={styles.locationText}>
          📍 {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Obtendo localização...'}
        </Text>
      </View>

      <View style={styles.requestsContainer}>
        <Text style={styles.requestsTitle}>
          Solicitações ({tripRequests.length})
        </Text>
        
        {tripRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              Aguardando solicitações de passageiros...
            </Text>
            <Text style={styles.emptySubtext}>
              Você está visível na rede P2P
            </Text>
          </View>
        ) : (
          <FlatList
            data={tripRequests}
            renderItem={renderTripRequest}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.requestsList}
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
    padding: 16,
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  requestsList: {
    paddingBottom: 16,
  },
  requestCard: {
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
  },
  passengerRating: {
    fontSize: 16,
    color: '#FFA000',
  },
  requestInfo: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#333',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 16,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
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
