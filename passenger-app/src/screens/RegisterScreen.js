import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthService from '../../../shared/services/AuthService';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (!AuthService.validateEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Erro', passwordValidation.error);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.register({
        name,
        email,
        phone,
        password,
        userType: 'passenger',
      });

      if (result.success) {
        Alert.alert(
          'Cadastro realizado!',
          'Sua conta foi criada com sucesso.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Erro ao criar conta', result.error);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4CAF50', '#45a049', '#2e7d32']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Junte-se à comunidade Zubi</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Telefone (00) 00000-0000"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Senha (mínimo 6 caracteres)"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#4CAF50" />
                ) : (
                  <Text style={styles.buttonText}>Criar Conta</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.linkText}>
                  Já tem conta? <Text style={styles.linkTextBold}>Entrar</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
