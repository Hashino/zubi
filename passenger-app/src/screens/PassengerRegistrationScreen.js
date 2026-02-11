import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AuthService from '../../../shared/services/AuthService';
import KeyManagementService from '../../../shared/services/KeyManagementService';
import StorageService from '../../../shared/services/StorageService';

/**
 * PassengerRegistrationScreen - Cadastro de passageiro com integração Web3
 * Implementa registro simplificado focado em carteira digital
 */
export default function PassengerRegistrationScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    agreedToTerms: false,
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    console.log('[PassengerRegistration] Validating form:', formData);
    
    if (!formData.name || !formData.email || !formData.phone) {
      console.log('[PassengerRegistration] Missing required fields:', {
        name: !!formData.name,
        email: !!formData.email,
        phone: !!formData.phone,
      });
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log('[PassengerRegistration] Invalid email:', formData.email);
      Alert.alert('Erro', 'Email inválido');
      return false;
    }
    
    if (!formData.agreedToTerms) {
      console.log('[PassengerRegistration] Terms not agreed');
      Alert.alert('Erro', 'Você precisa concordar com os termos de uso');
      return false;
    }
    
    console.log('[PassengerRegistration] Form validation passed');
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // 1. Registra usuário no AuthService
      const authResult = await AuthService.register({
        email: formData.email,
        password: formData.phone, // usando telefone como senha temporária
        name: formData.name,
        phone: formData.phone,
        userType: 'passenger',
      });

      if (!authResult.success) {
        throw new Error(authResult.error || 'Falha ao registrar usuário');
      }

      // 2. Gera keypair criptográfica
      const keyResult = await KeyManagementService.initialize(authResult.user.id);
      if (!keyResult.success) {
        throw new Error('Falha ao gerar chaves criptográficas');
      }

      // 3. Cria perfil do passageiro
      const passengerProfile = {
        userId: authResult.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        publicKey: keyResult.publicKey,
        
        // Carteira digital (para pagamentos Web3)
        wallet: {
          address: null, // será conectada posteriormente
          balance: 0,
        },
        
        stats: {
          totalTrips: 0,
          totalSpent: 0,
          rating: 5.0,
          ratings: [],
        },
        
        preferences: {
          paymentMethod: 'web3', // web3, pix, card
          maxWaitTime: 10, // minutos
          acceptShared: false, // corridas compartilhadas
        },
        
        createdAt: Date.now(),
      };

      await StorageService.setItem(`passenger_profile_${authResult.user.id}`, passengerProfile);

      Alert.alert(
        'Cadastro Realizado!',
        'Bem-vindo ao Zubi! Você já pode começar a solicitar corridas.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Search'),
          },
        ]
      );
    } catch (error) {
      console.error('[PassengerRegistration] Error:', error);
      Alert.alert('Erro', error.message || 'Falha ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cadastro de Passageiro</Text>
      <Text style={styles.subtitle}>Comece a usar o Zubi em minutos</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
          autoCapitalize="words"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Telefone (com DDD)"
          value={formData.phone}
          onChangeText={(text) => updateField('phone', text)}
          keyboardType="phone-pad"
        />
        
        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>✓ Pagamentos descentralizados</Text>
          <Text style={styles.featureText}>
            Pague com criptomoedas ou métodos tradicionais
          </Text>
        </View>
        
        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>✓ Sem intermediários</Text>
          <Text style={styles.featureText}>
            Comunicação P2P direta com motoristas
          </Text>
        </View>
        
        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>✓ Segurança criptográfica</Text>
          <Text style={styles.featureText}>
            Suas viagens são verificadas por blockchain
          </Text>
        </View>
        
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => updateField('agreedToTerms', !formData.agreedToTerms)}
          >
            <View style={[styles.checkboxBox, formData.agreedToTerms && styles.checkboxChecked]}>
              {formData.agreedToTerms && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Aceito os termos do Protocolo de Mobilidade Cooperativa Descentralizada (PMCD)
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Criar Conta</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>Já tem conta? Faça login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  featureBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  termsContainer: {
    marginVertical: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#4CAF50',
    fontSize: 14,
  },
});
