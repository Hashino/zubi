import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Bem-vindo ao Zubi</Text>
          <Text style={styles.subtitle}>
            Mobilidade Cooperativa Descentralizada
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Como funciona?</Text>
          <Text style={styles.infoText}>
            • Sem intermediários centralizados{'\n'}
            • Conexão P2P direta com motoristas{'\n'}
            • Pagamento via smart contracts{'\n'}
            • Validação de presença por QR Code{'\n'}
            • Taxas reduzidas e transparentes
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Taxas por nível do motorista:</Text>
          <Text style={styles.infoText}>
            • Iniciante (0-500 XP): 15%{'\n'}
            • Intermediário (500-1000 XP): 10%{'\n'}
            • Veterano (1000+ XP): 5%
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.buttonText}>Buscar Motorista</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Protocolo de Mobilidade Cooperativa Descentralizada (PMCD)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});
