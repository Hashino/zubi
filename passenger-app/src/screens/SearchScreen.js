import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as Location from 'expo-location';
import { useP2P } from '../services/P2PService';

// warn: No background location tracking
// TODO: Add real-time driver location updates
// TODO: Implement map view with driver pins
// FIX: Add pull-to-refresh functionality
// bug: Location permission is requested every time - should cache permission status

export default function SearchScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { peers, discoverPeers, connectToPeer } = useP2P();

  useEffect(() => {
    getLocationAndSearch();
  }, []);

  const getLocationAndSearch = async () => {
    // TODO: Add location caching to reduce API calls
    // FIX: Handle location services disabled scenario
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização negada');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      
      // Descobrir motoristas próximos
      discoverPeers(currentLocation.coords);
      setLoading(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter localização');
      setLoading(false);
    }
  };

  const handleSelectDriver = async (driver) => {
    // TODO: Add driver profile view before confirming
    // TODO: Add destination input dialog
    Alert.alert(
      'Confirmar Solicitação',
      `Deseja solicitar viagem com ${driver.name}?\n\n` +
      `Veículo: ${driver.vehicle}\n` +
      `Placa: ${driver.plate}\n` +
      `Distância: ${driver.distance.toFixed(1)} km\n` +
      `Nível: ${driver.level}\n` +
      `Taxa: ${driver.level === 'Veterano' ? '5%' : driver.level === 'Intermediário' ? '10%' : '15%'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            // For now, use current location + offset as destination
            // TODO: Add destination picker screen
            const origin = {
              latitude: location.latitude,
              longitude: location.longitude,
              address: 'Sua localização',
            };
            
            const destination = {
              latitude: location.latitude + 0.01,
              longitude: location.longitude + 0.01,
              address: 'Destino (mock)',
            };

            const connected = await connectToPeer(driver.id, origin, destination);
            if (connected) {
              navigation.navigate('Trip', { 
                driver,
                tripId: 'trip_' + Date.now()
              });
            } else {
              Alert.alert('Erro', 'Não foi possível conectar ao motorista');
            }
          }
        }
      ]
    );
  };

  const renderDriverItem = ({ item }) => (
    <TouchableOpacity
      style={styles.driverCard}
      onPress={() => handleSelectDriver(item)}
    >
      <View style={styles.driverHeader}>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.driverRating}>⭐ {item.rating}</Text>
      </View>
      
      <Text style={styles.driverVehicle}>{item.vehicle}</Text>
      <Text style={styles.driverPlate}>Placa: {item.plate}</Text>
      
      <View style={styles.driverFooter}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.level}</Text>
        </View>
        <Text style={styles.driverDistance}>{item.distance.toFixed(1)} km</Text>
      </View>
      
      <View style={styles.feeInfo}>
        <Text style={styles.feeText}>
          Taxa: {item.level === 'Veterano' ? '5%' : item.level === 'Intermediário' ? '10%' : '15%'}
        </Text>
        <Text style={styles.xpText}>XP: {item.xp}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Buscando motoristas próximos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Motoristas disponíveis ({peers.length})
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={getLocationAndSearch}
        >
          <Text style={styles.refreshText}>🔄 Atualizar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={peers}
        renderItem={renderDriverItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhum motorista disponível no momento
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  list: {
    padding: 16,
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
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  driverRating: {
    fontSize: 16,
    color: '#FFA000',
  },
  driverVehicle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  driverPlate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  driverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  driverDistance: {
    fontSize: 14,
    color: '#666',
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  feeText: {
    fontSize: 12,
    color: '#666',
  },
  xpText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
