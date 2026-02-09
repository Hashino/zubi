import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Animated,
  Switch,
  Modal,
  FlatList,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState([
    { id: 1, name: 'Casa', address: 'Rua das Flores, 123', icon: '🏠' },
    { id: 2, name: 'Trabalho', address: 'Av. Paulista, 1000', icon: '🏢' },
  ]);
  const [newFavorite, setNewFavorite] = useState({ name: '', address: '', icon: '📍' });
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const recentTrips = [
    { id: 1, date: '2024-02-08', origin: 'Centro', destination: 'Shopping Mall', cost: 25.50, driver: 'João Silva', rating: 5 },
    { id: 2, date: '2024-02-08', origin: 'Casa', destination: 'Aeroporto', cost: 45.00, driver: 'Maria Santos', rating: 5 },
    { id: 3, date: '2024-02-07', origin: 'Trabalho', destination: 'Universidade', cost: 18.75, driver: 'Carlos Lima', rating: 4 },
    { id: 4, date: '2024-02-07', origin: 'Shopping', destination: 'Casa', cost: 22.30, driver: 'Ana Costa', rating: 5 },
  ];

  const tips = [
    '💡 Adicione locais favoritos para buscar mais rápido!',
    '🔋 Mantenha seu celular carregado durante viagens longas.',
    '⭐ Avalie seus motoristas para ajudar outros passageiros.',
    '💰 Motoristas veteranos cobram taxas menores.',
    '📱 Use QR codes para validar sua presença rapidamente.',
  ];

  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    return () => {
      clearInterval(tipInterval);
      pulseAnimation.stop();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const addFavorite = () => {
    if (newFavorite.name && newFavorite.address) {
      const favorite = {
        id: Date.now(),
        ...newFavorite,
      };
      setFavorites([...favorites, favorite]);
      setNewFavorite({ name: '', address: '', icon: '📍' });
      Alert.alert('Sucesso', 'Local favorito adicionado!');
    } else {
      Alert.alert('Erro', 'Preencha nome e endereço do local favorito.');
    }
  };

  const renderTripItem = ({ item }) => (
    <View style={styles.tripItem}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripDate}>{item.date}</Text>
        <Text style={styles.tripRating}>{'⭐'.repeat(item.rating)}</Text>
      </View>
      <Text style={styles.tripRoute}>📍 {item.origin} → {item.destination}</Text>
      <Text style={styles.tripDriver}>🚗 {item.driver}</Text>
      <Text style={styles.tripCost}>💰 R$ {item.cost.toFixed(2)}</Text>
    </View>
  );

  const renderFavoriteItem = ({ item }) => (
    <View style={styles.favoriteItem}>
      <Text style={styles.favoriteIcon}>{item.icon}</Text>
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{item.name}</Text>
        <Text style={styles.favoriteAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => {
          setShowFavorites(false);
          navigation.navigate('Search', { destination: item });
        }}
      >
        <Text style={styles.favoriteButtonText}>Ir</Text>
      </TouchableOpacity>
    </View>
  );

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={theme.statusBar} />
      
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.iconButtonText}>📋</Text>
        </TouchableOpacity>

        <View style={styles.darkModeToggle}>
          <Text style={[styles.toggleLabel, { color: theme.text }]}>🌙</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={darkMode ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={darkMode ? ['#2E7D32', '#1B5E20', '#0F4C1C'] : ['#4CAF50', '#388E3C', '#2E7D32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.logoEmoji}>🚗</Text>
          <Text style={styles.title}>Zubi Passageiro</Text>
          <Text style={styles.subtitle}>
            Sua próxima viagem começa aqui
          </Text>
        </LinearGradient>

        <Animated.View style={[styles.tipCard, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.tipText}>{tips[currentTip]}</Text>
        </Animated.View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowFavorites(true)}
          >
            <Text style={styles.actionEmoji}>⭐</Text>
            <Text style={styles.actionLabel}>Favoritos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowHistory(true)}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionLabel}>Histórico</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert('Em breve', 'Promoções em desenvolvimento!')}
          >
            <Text style={styles.actionEmoji}>🎁</Text>
            <Text style={styles.actionLabel}>Promoções</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.benefitsCard}>
          <View style={styles.iconHeader}>
            <Text style={styles.cardIcon}>🚀</Text>
            <Text style={styles.infoTitle}>Por que escolher o Zubi?</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitText}>Preços até 40% menores que apps tradicionais</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <Text style={styles.benefitText}>Pagamentos seguros via blockchain</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Conexão direta e instantânea</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🌱</Text>
            <Text style={styles.benefitText}>Economia colaborativa sustentável</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.iconHeader}>
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={styles.infoTitle}>Taxas por nível do motorista</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥉 Iniciante (0-500 XP)</Text>
            <Text style={styles.feePercent}>15%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥈 Intermediário (500-1000 XP)</Text>
            <Text style={styles.feePercent}>10%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥇 Veterano (1000+ XP)</Text>
            <Text style={[styles.feePercent, styles.feeHighlight]}>5%</Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              handlePressOut();
              navigation.navigate('Search');
            }}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049', '#43A047']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>🔍 Buscar Motorista</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Histórico de Viagens</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentTrips}
              renderItem={renderTripItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal
        visible={showFavorites}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ Locais Favoritos</Text>
              <TouchableOpacity onPress={() => setShowFavorites(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.addFavoriteSection}>
              <Text style={styles.sectionTitle}>Adicionar Novo Favorito</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do local (ex: Casa, Trabalho)"
                value={newFavorite.name}
                onChangeText={(text) => setNewFavorite({...newFavorite, name: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Endereço completo"
                value={newFavorite.address}
                onChangeText={(text) => setNewFavorite({...newFavorite, address: text})}
              />
              <TouchableOpacity style={styles.addButton} onPress={addFavorite}>
                <Text style={styles.addButtonText}>➕ Adicionar</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={favorites}
              renderItem={renderFavoriteItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.favoritesList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const lightTheme = {
  background: '#f5f5f5',
  text: '#333',
  statusBar: '#388E3C',
};

const darkTheme = {
  background: '#121212',
  text: '#fff',
  statusBar: '#000',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    fontSize: 24,
  },
  darkModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 18,
    marginRight: 8,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F5E9',
    textAlign: 'center',
    fontWeight: '500',
  },
  tipCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  tipText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  benefitsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#2E7D32',
    flex: 1,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feeLevel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  feePercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  feeHighlight: {
    color: '#4CAF50',
    fontSize: 18,
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  tripItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripDate: {
    fontSize: 12,
    color: '#666',
  },
  tripRating: {
    fontSize: 12,
  },
  tripRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tripDriver: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  tripCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  addFavoriteSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  favoritesList: {
    maxHeight: 300,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  favoriteIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 13,
    color: '#666',
  },
  favoriteButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  favoriteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});