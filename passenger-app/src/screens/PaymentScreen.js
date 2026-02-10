import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import PaymentService, { PaymentMethod } from '../../shared/services/PaymentService';

export default function PaymentScreen({ route, navigation }) {
  const { ride } = route.params;
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (selectedMethod) {
      const calc = PaymentService.calculatePaymentBreakdown(
        ride.estimatedFare,
        selectedMethod
      );
      setBreakdown(calc);
    }
  }, [selectedMethod, ride.estimatedFare]);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      // Mock user profile
      const userProfile = {
        hasWeb3Wallet: false, // Can be true if user connected wallet
      };
      
      const methods = await PaymentService.getAvailablePaymentMethods(userProfile);
      setAvailableMethods(methods);
      
      // Pre-select PIX as default
      const pixMethod = methods.find(m => m.type === PaymentMethod.PIX);
      if (pixMethod) {
        setSelectedMethod(pixMethod.type);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Erro', 'Não foi possível carregar métodos de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Atenção', 'Selecione um método de pagamento');
      return;
    }

    setProcessing(true);

    try {
      const paymentData = {};
      
      // For different payment methods, gather required data
      if (selectedMethod === PaymentMethod.CRYPTO) {
        // Would need to connect wallet first
        paymentData.walletAddress = '0x...'; // Mock
      } else if (selectedMethod === PaymentMethod.CREDIT_CARD) {
        // Would show card input form first
        paymentData.cardToken = 'tok_...'; // Mock tokenized card
      }

      const result = await PaymentService.processPayment(
        {
          id: ride.id,
          amount: ride.estimatedFare,
          driverId: ride.driverId,
          passengerId: ride.passengerId,
        },
        selectedMethod,
        paymentData
      );

      if (result.status === 'COMPLETED') {
        Alert.alert(
          'Pagamento Confirmado!',
          `Pagamento de R$ ${ride.estimatedFare.toFixed(2)} realizado com sucesso.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else if (result.status === 'PENDING' && selectedMethod === PaymentMethod.PIX) {
        // Show PIX QR Code
        navigation.navigate('PixPayment', { payment: result });
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Erro no Pagamento', error.message || 'Tente novamente');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Carregando métodos de pagamento...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Ride Summary */}
        <View style={styles.rideSummary}>
          <Text style={styles.sectionTitle}>Resumo da Corrida</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Distância:</Text>
            <Text style={styles.summaryValue}>{ride.estimatedDistance} km</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor:</Text>
            <Text style={styles.summaryValueLarge}>R$ {ride.estimatedFare.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Método de Pagamento</Text>
          
          {availableMethods.map((method) => (
            <TouchableOpacity
              key={method.type}
              style={[
                styles.methodCard,
                selectedMethod === method.type && styles.methodCardSelected,
              ]}
              onPress={() => setSelectedMethod(method.type)}
            >
              <View style={styles.methodLeft}>
                <Text style={styles.methodIcon}>{method.icon}</Text>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodFee}>Taxa: {method.fee}</Text>
                </View>
              </View>
              
              {method.discount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{method.badge}</Text>
                </View>
              )}
              
              <View style={[
                styles.radioButton,
                selectedMethod === method.type && styles.radioButtonSelected,
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Breakdown */}
        {breakdown && (
          <View style={styles.breakdown}>
            <Text style={styles.sectionTitle}>Detalhamento</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Valor base:</Text>
              <Text style={styles.breakdownValue}>R$ {breakdown.baseAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Taxa da plataforma ({breakdown.platformFee / breakdown.baseAmount * 100}%):</Text>
              <Text style={styles.breakdownValue}>R$ {breakdown.platformFee.toFixed(2)}</Text>
            </View>
            {breakdown.gatewayFee > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Taxa de processamento:</Text>
                <Text style={styles.breakdownValue}>R$ {breakdown.gatewayFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownLabelBold}>Total:</Text>
              <Text style={styles.breakdownValueBold}>R$ {breakdown.totalAmount.toFixed(2)}</Text>
            </View>
            
            <Text style={styles.breakdownNote}>
              Motorista recebe: R$ {breakdown.driverReceives.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Crypto Info */}
        {selectedMethod === PaymentMethod.CRYPTO && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>⚡ Pagamento Crypto</Text>
            <Text style={styles.infoText}>
              • Pagamento processado via smart contract{'\n'}
              • Taxa vai direto para manutenção da rede{'\n'}
              • Você não precisa confiar em intermediários{'\n'}
              • Transação auditável na blockchain
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing || !selectedMethod}
        >
          {processing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {selectedMethod === PaymentMethod.CASH ? 'Confirmar' : 'Pagar'}
              </Text>
              <Text style={styles.payButtonAmount}>R$ {ride.estimatedFare.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6C5CE7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  rideSummary: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryValueLarge: {
    fontSize: 24,
    color: '#6C5CE7',
    fontWeight: 'bold',
  },
  methodsSection: {
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F0EDFF',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodFee: {
    fontSize: 14,
    color: '#666',
  },
  discountBadge: {
    backgroundColor: '#00D084',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    marginLeft: 8,
  },
  radioButtonSelected: {
    borderColor: '#6C5CE7',
    backgroundColor: '#6C5CE7',
  },
  breakdown: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#333',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  breakdownLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  breakdownValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C5CE7',
  },
  breakdownNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  payButton: {
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  payButtonAmount: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
