# Zubi - Sistema Completo de Rideshare P2P

## Funcionalidades Implementadas

### ✅ Core Services

1. **RideMatchingService** (`shared/services/RideMatchingService.js`)
   - Matching de passageiros e motoristas
   - Cálculo de distância e tarifa
   - Gerenciamento de corridas ativas
   - Sistema de eventos em tempo real
   - Histórico de corridas

2. **PaymentService** (`shared/services/PaymentService.js`)
   - Suporte a múltiplos métodos de pagamento
   - Cálculo de taxas por método
   - Orquestração de pagamentos

3. **Payment Method Services**
   - **PixPaymentService**: Integração PIX (mock para MVP)
   - **CreditCardService**: Pagamentos com cartão (mock para MVP)
   - **Web3PaymentService**: Pagamentos crypto via smart contracts (mock para MVP)

4. **LocationService** (`shared/services/LocationService.js`)
   - Rastreamento GPS em tempo real
   - Geocoding e reverse geocoding
   - Cálculo de distâncias
   - Monitoramento contínuo de localização

5. **AuthService** (`shared/services/AuthService.js`)
   - Registro e login
   - Gestão de sessões
   - Validação de dados

6. **StorageService** (`shared/services/StorageService.js`)
   - Persistência local de dados
   - Histórico de corridas
   - Configurações do usuário

7. **QRSecurityService** (`shared/services/QRSecurityService.js`)
   - Geração de QR codes seguros
   - Validação criptográfica
   - Proteção contra replay attacks

### 📱 Screens

#### Passenger App
- **LoginScreen**: Autenticação
- **RegisterScreen**: Cadastro
- **HomeScreen**: Tela principal com busca de corridas
- **TripScreen**: Tela durante a corrida
- **PaymentScreen**: Seleção e processamento de pagamento

#### Driver App
- **HomeScreen**: Controle de disponibilidade
- **TripScreen**: Gerenciamento de corridas ativas

## Fluxo Completo de Uma Corrida

### 1. Passageiro Solicita Corrida
```javascript
// O PassengerApp usa RideMatchingService
const result = await RideMatchingService.requestRide(
  passengerProfile,
  origin,
  destination
);
// Sistema encontra motoristas próximos automaticamente
```

### 2. Motorista Recebe e Aceita
```javascript
// DriverApp recebe notificação via eventos
RideMatchingService.on(`rideRequest:${driverId}`, (ride) => {
  // Mostra solicitação para o motorista
});

// Motorista aceita
await RideMatchingService.acceptRide(driverId, rideId);
```

### 3. Corrida em Andamento
```javascript
// LocationService rastreia ambos em tempo real
await LocationService.startWatching((location) => {
  RideMatchingService.updateDriverLocation(driverId, location);
});

// Atualiza status da corrida
await RideMatchingService.updateRideStatus(
  rideId,
  RideStatus.IN_PROGRESS
);
```

### 4. Finalização e Pagamento
```javascript
// Completa a corrida
await RideMatchingService.completeRide(
  rideId,
  actualFare,
  paymentMethod
);

// Processa pagamento
const payment = await PaymentService.processPayment(
  rideDetails,
  PaymentMethod.PIX, // ou CRYPTO, CREDIT_CARD, CASH
  paymentData
);
```

## Métodos de Pagamento

### 💵 Dinheiro
- Registro local apenas
- Motorista confirma recebimento
- Taxa: 0% (sem processamento)

### 🔷 PIX
- Gera QR Code para pagamento
- Via gateway (Mercado Pago/Stripe)
- Taxa: 5% da plataforma
- Mock para MVP (pronto para integração)

### 💳 Cartão de Crédito
- Tokenização segura (PCI-compliant)
- Via gateway (Stripe/Mercado Pago)
- Taxa: 5% da plataforma + taxa do gateway
- Mock para MVP (pronto para integração)

### ⚡ Crypto (Web3)
- Smart contract gerencia escrow
- Distribuição automática:
  - 97% para motorista (desconto de 2%)
  - 3% para carteira de manutenção da rede
- **Você não toca no dinheiro**
- Blockchain: Ethereum/Polygon/Arbitrum
- Mock para MVP (pronto para deploy de contrato)

## Sistema de Taxas

| Método | Taxa Plataforma | Taxa Gateway | Motorista Recebe | Desconto |
|--------|----------------|--------------|------------------|----------|
| Dinheiro | 5% | 0% | 95% | - |
| PIX | 5% | ~R$ 0,99 | 95% | - |
| Cartão | 5% | ~3,99% | 95% | - |
| Crypto | 3% | ~$0.001 | 97% | ✅ 2% off |

## Arquitetura do Sistema

```
┌─────────────────┐         ┌─────────────────┐
│  Passenger App  │◄───────►│   Driver App    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └──────────┬────────────────┘
                    │
         ┌──────────▼──────────┐
         │ RideMatchingService │
         │  (In-Memory P2P)    │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   PaymentService    │
         └──────────┬──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼───┐   ┌──▼──┐   ┌───▼────┐
    │  PIX  │   │Card │   │ Crypto │
    └───────┘   └─────┘   └────────┘
```

## Próximos Passos para Produção

### 1. Implementar P2P Real
Atualmente usa memória in-process (funciona apenas em um dispositivo).

**Opções:**
- **libp2p**: P2P networking completo
- **Nostr**: Rede de relays descentralizada
- **Gun.js**: Database distribuído
- **WebRTC**: Conexões peer-to-peer diretas

### 2. Deploy Smart Contract
```solidity
// ZubiRidePayment.sol já especificado no Web3PaymentService
// Precisa ser deployado em:
- Testnet: Polygon Mumbai / Arbitrum Goerli
- Mainnet: Polygon / Arbitrum / Base
```

### 3. Integrar Gateways de Pagamento

**PIX:**
```bash
# Mercado Pago
npm install mercadopago
# Configurar em PixPaymentService.js
```

**Cartão:**
```bash
# Stripe
npm install @stripe/stripe-react-native
# Configurar em CreditCardService.js
```

### 4. Blockchain Integration
```bash
npm install ethers wagmi viem @web3modal/wagmi
# Configurar em Web3PaymentService.js
# Deploy contract usando Hardhat/Foundry
```

## Status Atual

### ✅ Funcionando (MVP com Mocks)
- Autenticação de usuários
- Matching de corridas (simulado)
- Rastreamento de localização
- Cálculo de tarifas
- Seleção de métodos de pagamento
- UI completa para passageiro e motorista
- Histórico de corridas
- Sistema de níveis (XP) para motoristas

### 🚧 Mock (Pronto para Integração Real)
- Comunicação P2P (usa memória local)
- Pagamentos PIX (precisa de chave de API)
- Pagamentos Cartão (precisa de chave de API)
- Pagamentos Crypto (precisa de deploy de contrato)

### 📋 TODO para Produção
- [ ] Implementar libp2p ou Nostr para P2P real
- [ ] Deploy smart contract na blockchain
- [ ] Integrar APIs de pagamento (Mercado Pago/Stripe)
- [ ] Adicionar notificações push
- [ ] Implementar chat end-to-end encrypted
- [ ] Backend para analytics e monitoring
- [ ] Testes automatizados
- [ ] CI/CD pipeline

## Como Testar o MVP

1. **Instale ambos os APKs:**
   - `zubi-passenger-app.apk` em um dispositivo
   - `zubi-driver-app.apk` em outro dispositivo

2. **No Driver App:**
   - Faça login/registro
   - Ative o modo "Online"
   - Aguarde solicitações de corrida

3. **No Passenger App:**
   - Faça login/registro
   - Busque uma corrida (define origem/destino)
   - Sistema encontra motorista mockado
   - Aceite a corrida
   - Selecione método de pagamento
   - Finalize a corrida

**Nota:** Para MVP, o matching está simulado localmente. Em produção, usará rede P2P real.

## Vantagens do Sistema

### Para Passageiros
- ✅ Múltiplas opções de pagamento
- ✅ Transparência nas taxas
- ✅ Opção crypto com desconto
- ✅ Sem intermediários nas transações crypto
- ✅ Histórico completo de corridas

### Para Motoristas
- ✅ Taxas menores para veteranos (sistema de XP)
- ✅ Recebimento direto (crypto)
- ✅ Sistema de gamificação (níveis)
- ✅ Controle total de disponibilidade

### Para a Rede
- ✅ Descentralizada (P2P)
- ✅ Taxa de manutenção automática (crypto)
- ✅ Transparente e auditável
- ✅ Sem ponto único de falha

## Arquivos Principais

```
zubi/
├── shared/services/
│   ├── RideMatchingService.js      # Core matching logic
│   ├── PaymentService.js           # Payment orchestrator
│   ├── PixPaymentService.js        # PIX integration
│   ├── CreditCardService.js        # Card integration
│   ├── Web3PaymentService.js       # Crypto integration
│   ├── LocationService.js          # GPS tracking
│   ├── AuthService.js              # Authentication
│   ├── StorageService.js           # Local storage
│   └── QRSecurityService.js        # QR security
│
├── passenger-app/src/screens/
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── HomeScreen.js               # Main passenger screen
│   ├── TripScreen.js               # During ride
│   └── PaymentScreen.js            # Payment selection
│
└── driver-app/src/screens/
    ├── HomeScreen.js               # Driver availability
    └── TripScreen.js               # Active ride management
```

## Contato e Suporte

Este é um sistema MVP funcional com mocks para demonstração.
Para produção, será necessário integrar serviços reais conforme documentado acima.
