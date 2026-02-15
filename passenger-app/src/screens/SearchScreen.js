import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import StorageService from '../../../shared/services/StorageService';

/**
 * SearchScreen - Nova versão: Passageiro escolhe apenas o DESTINO
 * 
 * Fluxo:
 * 1. Origem = Localização atual automática
 * 2. Passageiro digita/escolhe destino
 * 3. Calcula distância e valor estimado
 * 4. Ao confirmar, publica solicitação no Nostr
 * 5. Navega para RideWaitingScreen onde motoristas se candidatam
 */
export default function SearchScreen({ navigation }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationText, setDestinationText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [passengerProfile, setPassengerProfile] = useState(null);

  useEffect(() => {
    setupScreen();
  }, []);

  const setupScreen = async () => {
    try {
      // Carregar perfil do passageiro
      const profile = await StorageService.getUserProfile();
      if (!profile) {
        Alert.alert('Erro', 'Perfil de passageiro não encontrado');
        navigation.goBack();
        return;
      }
      setPassengerProfile(profile);

      // Obter localização atual
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização necessária');
        navigation.goBack();
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      setLoading(false);
    } catch (error) {
      console.error('[SearchScreen] Setup error:', error);
      Alert.alert('Erro', 'Não foi possível obter localização');
      navigation.goBack();
    }
  };

  const searchAddress = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Mock de busca de endereços
      // TODO: Integrar com Google Places API
      const results = await mockGeocodeSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error('[SearchScreen] Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const mockGeocodeSearch = async (query) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults = [
          {
            id: '1',
            address: `${query} - Centro, Vitória - ES`,
            latitude: currentLocation.latitude + 0.01,
            longitude: currentLocation.longitude + 0.01,
          },
          {
            id: '2',
            address: `${query} - Praia do Canto, Vitória - ES`,
            latitude: currentLocation.latitude + 0.02,
            longitude: currentLocation.longitude + 0.02,
          },
          {
            id: '3',
            address: `${query} - Vila Velha - ES`,
            latitude: currentLocation.latitude - 0.015,
            longitude: currentLocation.longitude - 0.01,
          },
        ];
        resolve(mockResults);
      }, 500);
    });
  };

  const selectDestination = (destination) => {
    setSelectedDestination(destination);
    setDestinationText(destination.address);
    setSearchResults([]);
  };

  const calculateDistance = () => {
    if (!currentLocation || !selectedDestination) return 0;

    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(selectedDestination.latitude - currentLocation.latitude);
    const dLon = deg2rad(selectedDestination.longitude - currentLocation.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(currentLocation.latitude)) *
      Math.cos(deg2rad(selectedDestination.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateFare = (distanceKm) => {
    const BASE_FARE = 5.0;
    const PER_KM = 2.5;
    const MIN_FARE = 8.0;
    
    const fare = BASE_FARE + (distanceKm * PER_KM);
    return Math.max(fare, MIN_FARE);
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const handleRequestRide = () => {
    if (!selectedDestination) {
      Alert.alert('Atenção', 'Selecione um destino');
      return;
    }

    const distance = calculateDistance();
    const fare = calculateFare(distance);

    Alert.alert(
      'Confirmar Solicitação',
      `Destino: ${selectedDestination.address}\n\n` +
      `Distância: ${distance.toFixed(1)} km\n` +
      `Valor estimado: R$ ${fare.toFixed(2)}\n\n` +
      `Motoristas próximos poderão se candidatar para sua corrida.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => publishRideRequest(distance, fare),
        }
      ]
    );
  };

  const publishRideRequest = (distance, fare) => {
    const rideRequest = {
      rideId: `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      passengerId: passengerProfile.userId,
      passengerName: passengerProfile.name,
      passengerRating: passengerProfile.rating || 5.0,
      origin: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: 'Sua localização atual',
      },
      destination: selectedDestination,
      estimatedDistance: parseFloat(distance.toFixed(2)),
      estimatedFare: parseFloat(fare.toFixed(2)),
      timestamp: Date.now(),
    };

    console.log('[SearchScreen] Publishing ride request:', rideRequest);

    // Navega para tela de espera
    navigation.navigate('RideWaiting', { rideRequest });
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => selectDestination(item)}
    >
      <Text style={styles.resultIcon}>📍</Text>
      <Text style={styles.resultText}>{item.address}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Obtendo sua localização...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Para onde vamos?</Text>
      </View>

      {/* Origem (automática) */}
      <View style={styles.locationSection}>
        <View style={styles.originRow}>
          <Text style={styles.originIcon}>🔵</Text>
          <View style={styles.originInfo}>
            <Text style={styles.originLabel}>Origem (sua localização)</Text>
            <Text style={styles.originCoords}>
              {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </Text>
          </View>
        </View>
      </View>

      {/* Destino (input) */}
      <View style={styles.destinationSection}>
        <View style={styles.destinationInputRow}>
          <Text style={styles.destIcon}>🔴</Text>
          <TextInput
            style={styles.destinationInput}
            placeholder="Digite o destino..."
            value={destinationText}
            onChangeText={(text) => {
              setDestinationText(text);
              searchAddress(text);
            }}
            autoFocus
          />
          {searching && <ActivityIndicator size="small" color="#4CAF50" />}
        </View>

        {/* Resultados da busca */}
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            style={styles.resultsList}
          />
        )}
      </View>

      {/* Estimativa */}
      {selectedDestination && searchResults.length === 0 && (
        <View style={styles.estimateSection}>
          <View style={styles.estimateCard}>
            <Text style={styles.estimateTitle}>Estimativa da Corrida</Text>
            
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>📏 Distância:</Text>
              <Text style={styles.estimateValue}>
                {calculateDistance().toFixed(1)} km
              </Text>
            </View>

            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>💰 Valor estimado:</Text>
              <Text style={styles.estimateValue}>
                R$ {calculateFare(calculateDistance()).toFixed(2)}
              </Text>
            </View>

            <Text style={styles.estimateNote}>
              *Valor final pode variar conforme o nível do motorista escolhido
            </Text>
          </View>

          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequestRide}
          >
            <Text style={styles.requestButtonText}>
              Solicitar Corrida
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instruções */}
      {!selectedDestination && searchResults.length === 0 && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsIcon}>💡</Text>
          <Text style={styles.instructionsTitle}>Como funciona?</Text>
          <Text style={styles.instructionsText}>
            1. Digite o endereço de destino{'\n'}
            2. Veja a estimativa de valor{'\n'}
            3. Confirme a solicitação{'\n'}
            4. Motoristas próximos se candidatarão{'\n'}
            5. Escolha o motorista que preferir
          </Text>
        </View>
      )}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  locationSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  originInfo: {
    flex: 1,
  },
  originLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  originCoords: {
    fontSize: 12,
    color: '#999',
  },
  destinationSection: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  destinationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  destIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  destinationInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  resultText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  estimateSection: {
    padding: 16,
  },
  estimateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estimateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  estimateLabel: {
    fontSize: 16,
    color: '#666',
  },
  estimateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  estimateNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  requestButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  instructionsIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left',
    lineHeight: 28,
  },
});
