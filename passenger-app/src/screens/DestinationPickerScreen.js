import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import LocationService from '../../../shared/services/LocationService';

/**
 * DestinationPickerScreen - Seleção de origem e destino com busca de endereços
 * Implementa busca de corridas reais com origem e destino
 */
export default function DestinationPickerScreen({ navigation }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [searchMode, setSearchMode] = useState(null); // 'origin' ou 'destination'
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos acessar sua localização');
        return;
      }
    } catch (error) {
      console.error('[DestinationPicker] Permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location.success) {
        setOrigin({
          latitude: location.location.latitude,
          longitude: location.location.longitude,
          address: 'Localização atual',
        });
        setOriginText('Localização atual');
      } else {
        Alert.alert('Erro', 'Não foi possível obter sua localização');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao obter localização');
    } finally {
      setLoadingLocation(false);
    }
  };

  const searchAddress = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Busca por endereços usando geocoding
      // Nota: Para produção, integrar com Google Places API
      // Por enquanto, vamos simular com dados mockados
      const results = await mockGeocodeSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error('[DestinationPicker] Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Mock de geocoding (substituir por Google Places API)
  const mockGeocodeSearch = async (query) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults = [
          {
            id: '1',
            address: `${query} - Centro, São Paulo - SP`,
            latitude: -23.5505,
            longitude: -46.6333,
          },
          {
            id: '2',
            address: `${query} - Zona Sul, São Paulo - SP`,
            latitude: -23.6505,
            longitude: -46.6333,
          },
          {
            id: '3',
            address: `${query} - Zona Norte, São Paulo - SP`,
            latitude: -23.4505,
            longitude: -46.6333,
          },
        ];
        resolve(mockResults);
      }, 500);
    });
  };

  const selectLocation = (location) => {
    if (searchMode === 'origin') {
      setOrigin(location);
      setOriginText(location.address);
    } else {
      setDestination(location);
      setDestinationText(location.address);
    }
    setSearchMode(null);
    setSearchResults([]);
  };

  const calculateEstimatedFare = () => {
    if (!origin || !destination) return 0;
    
    // Calcula distância aproximada usando Haversine
    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(destination.latitude - origin.latitude);
    const dLon = deg2rad(destination.longitude - origin.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(origin.latitude)) *
      Math.cos(deg2rad(destination.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Tarifa base: R$ 5,00 + R$ 2,50/km
    const fare = 5.0 + (distance * 2.5);
    return { fare: fare.toFixed(2), distance: distance.toFixed(1) };
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const handleSearchRide = () => {
    if (!origin || !destination) {
      Alert.alert('Atenção', 'Selecione origem e destino');
      return;
    }

    const { fare, distance } = calculateEstimatedFare();
    
    navigation.navigate('Search', {
      origin,
      destination,
      estimatedFare: fare,
      distance,
    });
  };

  const renderSearchResults = () => {
    if (!searchMode) return null;

    return (
      <View style={styles.searchResultsContainer}>
        <View style={styles.searchHeader}>
          <Text style={styles.searchTitle}>
            {searchMode === 'origin' ? 'Selecione a origem' : 'Selecione o destino'}
          </Text>
          <TouchableOpacity onPress={() => setSearchMode(null)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {searchMode === 'origin' && (
          <TouchableOpacity 
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <>
                <Text style={styles.currentLocationIcon}>📍</Text>
                <Text style={styles.currentLocationText}>Usar localização atual</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.resultItem}
                onPress={() => selectLocation(item)}
              >
                <Text style={styles.resultIcon}>📍</Text>
                <Text style={styles.resultText}>{item.address}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchResults.length === 0 && originText.length >= 3
                  ? 'Nenhum resultado encontrado'
                  : 'Digite pelo menos 3 caracteres para buscar'}
              </Text>
            }
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Para onde vamos?</Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔵</Text>
          <TextInput
            style={styles.input}
            placeholder="Origem"
            value={originText}
            onChangeText={(text) => {
              setOriginText(text);
              if (searchMode === 'origin') {
                searchAddress(text);
              }
            }}
            onFocus={() => setSearchMode('origin')}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔴</Text>
          <TextInput
            style={styles.input}
            placeholder="Destino"
            value={destinationText}
            onChangeText={(text) => {
              setDestinationText(text);
              if (searchMode === 'destination') {
                searchAddress(text);
              }
            }}
            onFocus={() => setSearchMode('destination')}
          />
        </View>
      </View>

      {origin && destination && !searchMode && (
        <View style={styles.estimateContainer}>
          <Text style={styles.estimateTitle}>Estimativa</Text>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Distância:</Text>
            <Text style={styles.estimateValue}>{calculateEstimatedFare().distance} km</Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Valor estimado:</Text>
            <Text style={styles.estimateValue}>R$ {calculateEstimatedFare().fare}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearchRide}
          >
            <Text style={styles.searchButtonText}>Buscar motorista</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderSearchResults()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentLocationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  currentLocationText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  loader: {
    marginTop: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  resultText: {
    flex: 1,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 14,
  },
  estimateContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  estimateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  estimateLabel: {
    fontSize: 16,
    color: '#666',
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
