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
import { useApp } from '../../../shared/contexts/AppContext';
import DiagnosticService from '../../../shared/services/DiagnosticService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { location, requestRide, activeRide } = useApp();
  const [darkMode, setDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [newFavorite, setNewFavorite] = useState({ name: '', address: '', icon: '📍' });
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const recentTrips = [];

  const tips = [
    '💡 Adicione locais favoritos para buscar mais rápido!',
    '🔋 Mantenha seu celular carregado durante viagens longas.',
    '⭐ Avalie seus motoristas para ajudar outros passageiros.',
    '💰 Motoristas veteranos cobram taxas menores.',
    '📱 Use QR codes para validar sua presença rapidamente.',
  ];

  const [currentTip, setCurrentTip] = useState(0);

  // Navigate to trip screen if there's an active ride
  useEffect(() => {
    if (activeRide && activeRide.status !== 'completed') {
      navigation.navigate('Trip', { ride: activeRide });
    }
  }, [activeRide, navigation]);

  const coupons = [];

  const getValidCoupons = () => coupons.filter(c => c.valid).length;

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

  const runDiagnostics = async () => {
    try {
      Alert.alert('Diagnóstico', 'Executando testes... Aguarde.');
      const results = await DiagnosticService.runFullDiagnostic();
      setDiagnosticResults(results);
      setShowDiagnostics(true);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao executar diagnósticos: ' + error.message);
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

  const renderCouponItem = ({ item }) => (
    <View style={[styles.couponItem, !item.valid && styles.usedCoupon]}>
      <View style={styles.couponHeader}>
        <View style={styles.couponLeft}>
          <Text style={[styles.couponCode, !item.valid && styles.usedCouponText]}>{item.code}</Text>
          <Text style={[styles.couponDiscount, !item.valid && styles.usedCouponText]}>{item.discount}</Text>
        </View>
        <View style={styles.couponRight}>
          <Text style={[styles.couponStatus, item.valid ? styles.validStatus : styles.usedStatus]}>
            {item.valid ? '✅ Válido' : '❌ Usado'}
          </Text>
        </View>
      </View>
      <Text style={[styles.couponDescription, !item.valid && styles.usedCouponText]}>{item.description}</Text>
      <Text style={styles.couponExpiry}>Válido até: {item.expiry}</Text>
      {item.valid && (
        <TouchableOpacity 
          style={styles.useCouponButton}
          onPress={() => Alert.alert('Cupom Aplicado!', `Cupom ${item.code} será usado na próxima viagem.`)}
        >
          <Text style={styles.useCouponText}>Usar Cupom</Text>
        </TouchableOpacity>
      )}
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
          colors={darkMode ? ['#1B5E20', '#2E7D32', '#388E3C'] : ['#4CAF50', '#45A049', '#43A047']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.logoEmoji}>🚗</Text>
          <Text style={styles.title}>Zubi</Text>
          <Text style={styles.subtitle}>Mobilidade P2P Descentralizada</Text>
        </LinearGradient>

        {/* Location Status */}
        {location && (
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              📍 Localização: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
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
            onPress={() => setShowCoupons(true)}
          >
            <Text style={styles.actionEmoji}>🎁</Text>
            <Text style={styles.actionLabel}>Cupons</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowHistory(true)}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionLabel}>Histórico</Text>
          </TouchableOpacity>
        </View>

        {/* Tip Carousel */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>{tips[currentTip]}</Text>
        </View>

        {/* Main Request Ride Button */}
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
              <Text style={styles.buttonText}>🚗 Solicitar Corrida</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <View style={styles.iconHeader}>
            <Text style={styles.cardIcon}>💎</Text>
            <Text style={styles.infoTitle}>Por que Zubi?</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔐</Text>
            <Text style={styles.benefitText}>100% Descentralizado - Sem intermediários</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitText}>Taxas baixas - Motoristas veteranos cobram apenas 5%</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Pagamento Crypto com 2% de desconto</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎯</Text>
            <Text style={styles.benefitText}>Validação de presença via QR Code</Text>
          </View>
        </View>

        {/* Fee Structure */}
        <View style={styles.infoCard}>
          <View style={styles.iconHeader}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.infoTitle}>Estrutura de Taxas</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥉 Iniciante</Text>
            <Text style={styles.feePercent}>15%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥈 Intermediário</Text>
            <Text style={styles.feePercent}>10%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>🥇 Veterano</Text>
            <Text style={[styles.feePercent, styles.feeHighlight]}>5%</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLevel}>⚡ Crypto Payment</Text>
            <Text style={[styles.feePercent, styles.feeHighlight]}>3% (Desconto!)</Text>
          </View>
        </View>
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

      {/* Coupons Modal */}
      <Modal
        visible={showCoupons}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎁 Seus Cupons</Text>
              <TouchableOpacity onPress={() => setShowCoupons(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.couponStats}>
              <Text style={styles.statsText}>
                Você tem {getValidCoupons()} cupons válidos
              </Text>
            </View>

            <FlatList
              data={coupons}
              renderItem={renderCouponItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.couponsList}
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
  couponStats: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  couponsList: {
    maxHeight: 400,
  },
  couponItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  usedCoupon: {
    backgroundColor: '#f5f5f5',
    borderLeftColor: '#ccc',
    opacity: 0.7,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  couponLeft: {
    flex: 1,
  },
  couponCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    fontFamily: 'monospace',
  },
  couponDiscount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 2,
  },
  usedCouponText: {
    color: '#999',
  },
  couponRight: {
    alignItems: 'flex-end',
  },
  couponStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  validStatus: {
    color: '#4CAF50',
  },
  usedStatus: {
    color: '#999',
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  couponExpiry: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  useCouponButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  useCouponText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});