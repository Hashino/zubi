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
  Alert,
  Switch,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDriver } from '../services/DriverService';
import { useApp } from '../../../shared/contexts/AppContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { driverProfile } = useDriver();
  const { location, activeRide } = useApp();
  const [darkMode, setDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Se não há perfil, redireciona para registro
  useEffect(() => {
    if (!driverProfile) {
      console.log('[HomeScreen] No driver profile, redirecting to Registration');
      navigation.replace('Registration');
    }
  }, [driverProfile, navigation]);

  // Loading state enquanto perfil carrega
  if (!driverProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const achievements = [];
  const recentTrips = [];
  const notifications = [];
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const getCompletedAchievements = () => achievements.filter(a => a.completed).length;
  const getTotalAchievements = () => achievements.length;

  useEffect(() => {
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
    
    return () => pulseAnimation.stop();
  }, []);

  // Navigate to trip screen if there's an active ride
  useEffect(() => {
    if (activeRide && activeRide.status !== 'completed') {
      navigation.navigate('Trip');
    }
  }, [activeRide, navigation]);

  const getLevelProgress = () => {
    const nextLevelXp = driverProfile?.level === 'Iniciante' ? 500 : driverProfile?.level === 'Intermediário' ? 1000 : 2000;
    return Math.min(((driverProfile?.xp || 0) / nextLevelXp) * 100, 100);
  };

  const getFeePercentage = () => {
    return driverProfile?.level === 'Veterano' ? '5%' : driverProfile?.level === 'Intermediário' ? '10%' : '15%';
  };

  const getLevelColor = () => {
    return driverProfile?.level === 'Veterano' ? '#FFD700' : driverProfile?.level === 'Intermediário' ? '#C0C0C0' : '#CD7F32';
  };

  const getLevelEmoji = () => {
    return driverProfile?.level === 'Veterano' ? '🥇' : driverProfile?.level === 'Intermediário' ? '🥈' : '🥉';
  };

  const getMotivationalMessage = () => {
    const messages = [
      'Continue dirigindo com segurança! 🚗',
      'Sua dedicação faz a diferença! 💪',
      'Obrigado por ser parte da revolução! 🌟',
      'Juntos construímos um futuro melhor! 🚀',
      'Cada viagem te aproxima do próximo nível! ⭐',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

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

  const renderTripItem = ({ item }) => (
    <View style={styles.tripItem}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripDate}>{item.date}</Text>
        <Text style={styles.tripRating}>{'⭐'.repeat(item.rating)}</Text>
      </View>
      <Text style={styles.tripDestination}>{item.destination}</Text>
      <Text style={styles.tripEarnings}>R$ {item.earnings.toFixed(2)}</Text>
    </View>
  );

  const renderNotificationItem = ({ item }) => (
    <View style={[styles.notificationItem, item.unread && styles.unreadNotification]}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        {item.unread && <View style={styles.unreadBadge} />}
      </View>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <Text style={styles.notificationTime}>{item.time} atrás</Text>
    </View>
  );

  const renderAchievementItem = ({ item }) => (
    <View style={[styles.achievementItem, item.completed && styles.completedAchievement]}>
      <View style={styles.achievementHeader}>
        <Text style={[styles.achievementTitle, item.completed && styles.completedTitle]}>{item.title}</Text>
        {item.completed && <Text style={styles.completedIcon}>✅</Text>}
      </View>
      <Text style={styles.achievementDescription}>{item.description}</Text>
      {item.progress && !item.completed && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{item.progress.toFixed(0)}%</Text>
        </View>
      )}
      {item.date && <Text style={styles.achievementDate}>Conquistado em {item.date}</Text>}
    </View>
  );

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={theme.statusBar} />
      
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowNotifications(true)}
        >
          <Text style={styles.iconButtonText}>🔔</Text>
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadNotifications}</Text>
            </View>
          )}
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
          colors={darkMode ? ['#1565C0', '#0D47A1', '#01579B'] : ['#2196F3', '#1976D2', '#1565C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <Text style={styles.greeting}>Olá, {driverProfile?.name || 'Motorista'}! 👋</Text>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
            <Text style={styles.levelText}>{getLevelEmoji()} {driverProfile?.level || 'Iniciante'}</Text>
          </View>
          <Text style={styles.xpText}>{driverProfile?.xp || 0} XP</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getLevelProgress()}%` }]} />
          </View>
          <Text style={styles.progressText}>{getLevelProgress().toFixed(0)}% até o próximo nível</Text>
        </LinearGradient>

        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>{getMotivationalMessage()}</Text>
          <Text style={styles.motivationSubtext}>
            Você está fazendo a diferença na mobilidade urbana!
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <Animated.View style={[styles.statCard, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.statEmoji}>🚗</Text>
            <Text style={styles.statNumber}>{driverProfile?.totalTrips || 0}</Text>
            <Text style={styles.statLabel}>Viagens</Text>
          </Animated.View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNumber}>{driverProfile?.rating || 5.0}</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={styles.statNumber}>R$ {(driverProfile?.totalEarnings || 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Ganhos</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.historyButtonText}>📋 Ver Histórico de Viagens</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.achievementsButton}
          onPress={() => setShowAchievements(true)}
        >
          <Text style={styles.achievementsButtonText}>
            🏆 Conquistas ({getCompletedAchievements()}/{getTotalAchievements()})
          </Text>
        </TouchableOpacity>

        <View style={styles.vehicleCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.cardIcon}>🚙</Text>
            <Text style={styles.cardTitle}>Veículo</Text>
          </View>
          <Text style={styles.vehicleInfo}>{driverProfile?.vehicle || 'Não informado'}</Text>
          <Text style={styles.vehiclePlate}>Placa: {driverProfile?.plate || 'N/A'}</Text>
          <View style={styles.feeInfo}>
            <Text style={styles.feeLabel}>Taxa atual:</Text>
            <Text style={styles.feeValue}>{getFeePercentage()}</Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              handlePressOut();
              navigation.navigate('Online');
            }}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049', '#43A047']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>🟢 Ficar Online</Text>
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

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔔 Notificações</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowNotifications(false);
                  setUnreadNotifications(0);
                }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Achievements Modal */}
      <Modal
        visible={showAchievements}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏆 Suas Conquistas</Text>
              <TouchableOpacity onPress={() => setShowAchievements(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.achievementStats}>
              <Text style={styles.statsText}>
                Progresso: {getCompletedAchievements()}/{getTotalAchievements()} conquistas
              </Text>
              <View style={styles.statsProgressBar}>
                <View style={[styles.statsProgressFill, { width: `${(getCompletedAchievements() / getTotalAchievements()) * 100}%` }]} />
              </View>
            </View>
            <FlatList
              data={achievements}
              renderItem={renderAchievementItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
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
  statusBar: '#1976D2',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconButton: {
    position: 'relative',
    padding: 8,
  },
  iconButtonText: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  profileCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  levelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  xpText: {
    color: '#E3F2FD',
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  progressText: {
    color: '#E3F2FD',
    fontSize: 12,
    fontWeight: '500',
  },
  motivationCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  motivationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F00',
    textAlign: 'center',
    marginBottom: 8,
  },
  motivationSubtext: {
    fontSize: 13,
    color: '#EF6C00',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
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
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  historyButton: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  historyButtonText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementsButton: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  achievementsButtonText: {
    color: '#FF6F00',
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vehicleInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
  },
  feeLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  feeValue: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
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
  tripDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tripEarnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadNotification: {
    borderLeftColor: '#FF5722',
    backgroundColor: '#FFF3E0',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
  },
  achievementStats: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statsProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  achievementItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  completedAchievement: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  completedTitle: {
    color: '#2E7D32',
  },
  completedIcon: {
    fontSize: 16,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  achievementDate: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
});