import React, { useState, useEffect } from 'react';
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
 * DriverRegistrationScreen - Cadastro completo de motorista com verificação de identidade
 * Implementa o sistema de Identidade Soberana do PMCD
 */
export default function DriverRegistrationScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Dados pessoais
    name: '',
    email: '',
    phone: '',
    cpf: '',
    
    // Dados do veículo
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    vehicleColor: '',
    
    // Documentos (para verificação futura)
    driverLicense: '',
    vehicleRegistration: '',
    
    // Concordância
    agreedToTerms: false,
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.cpf) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return false;
    }
    
    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erro', 'Email inválido');
      return false;
    }
    
    // Valida CPF (simplificado)
    if (formData.cpf.replace(/\D/g, '').length !== 11) {
      Alert.alert('Erro', 'CPF inválido');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.vehicleMake || !formData.vehicleModel || 
        !formData.vehicleYear || !formData.vehiclePlate || !formData.vehicleColor) {
      Alert.alert('Erro', 'Preencha todos os dados do veículo');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleRegister = async () => {
    if (!formData.agreedToTerms) {
      Alert.alert('Erro', 'Você precisa concordar com os termos de uso');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Registra usuário no AuthService
      const authResult = await AuthService.register({
        email: formData.email,
        password: formData.cpf, // usando CPF como senha temporária (será melhorado)
        name: formData.name,
        phone: formData.phone,
        userType: 'driver',
      });

      if (!authResult.success) {
        throw new Error(authResult.error || 'Falha ao registrar usuário');
      }

      // 2. Gera keypair criptográfica
      const keyResult = await KeyManagementService.initialize(authResult.user.id);
      if (!keyResult.success) {
        throw new Error('Falha ao gerar chaves criptográficas');
      }

      // 3. Cria perfil do motorista
      const driverProfile = {
        userId: authResult.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        publicKey: keyResult.publicKey,
        
        vehicle: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: formData.vehicleYear,
          plate: formData.vehiclePlate,
          color: formData.vehicleColor,
        },
        
        documents: {
          driverLicense: formData.driverLicense,
          vehicleRegistration: formData.vehicleRegistration,
          verified: false, // Será verificado por oráculos
        },
        
        // Dados de governança (PMCD)
        governance: {
          level: 'iniciante',
          xp: 0,
          hoursFlown: 0,
          validationsCompleted: 0,
          feeRate: 0.15, // 15% para iniciantes
        },
        
        stats: {
          totalTrips: 0,
          totalEarnings: 0,
          rating: 5.0,
          ratings: [],
        },
        
        status: 'pending_verification',
        createdAt: Date.now(),
      };

      await StorageService.saveDriverProfile(driverProfile);

      Alert.alert(
        'Cadastro Realizado!',
        'Seu cadastro foi enviado para verificação. Você receberá uma notificação quando for aprovado.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Home'),
          },
        ]
      );
    } catch (error) {
      console.error('[DriverRegistration] Error:', error);
      Alert.alert('Erro', error.message || 'Falha ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dados Pessoais</Text>
      
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
      
      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={formData.cpf}
        onChangeText={(text) => updateField('cpf', text)}
        keyboardType="number-pad"
        maxLength={14}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Próximo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dados do Veículo</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Marca (ex: Toyota, Honda)"
        value={formData.vehicleMake}
        onChangeText={(text) => updateField('vehicleMake', text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Modelo (ex: Corolla, Civic)"
        value={formData.vehicleModel}
        onChangeText={(text) => updateField('vehicleModel', text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Ano"
        value={formData.vehicleYear}
        onChangeText={(text) => updateField('vehicleYear', text)}
        keyboardType="number-pad"
        maxLength={4}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Placa"
        value={formData.vehiclePlate}
        onChangeText={(text) => updateField('vehiclePlate', text.toUpperCase())}
        autoCapitalize="characters"
        maxLength={7}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Cor"
        value={formData.vehicleColor}
        onChangeText={(text) => updateField('vehicleColor', text)}
      />
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]} 
          onPress={() => setStep(1)}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Próximo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Documentos e Termos</Text>
      
      <Text style={styles.infoText}>
        Para começar a dirigir no Zubi, você precisa enviar seus documentos para verificação.
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Número da CNH"
        value={formData.driverLicense}
        onChangeText={(text) => updateField('driverLicense', text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Número do CRLV"
        value={formData.vehicleRegistration}
        onChangeText={(text) => updateField('vehicleRegistration', text)}
      />
      
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
      
      <Text style={styles.feeInfo}>
        Taxa inicial: 15% (reduz conforme você ganha XP de Governança)
      </Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]} 
          onPress={() => setStep(2)}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Finalizar Cadastro</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cadastro de Motorista</Text>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
      </View>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#4CAF50',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSecondary: {
    backgroundColor: '#757575',
    flex: 1,
    marginRight: 10,
  },
  buttonPrimary: {
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
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
  feeInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});
