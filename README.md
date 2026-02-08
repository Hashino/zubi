# Zubi - Protocolo de Mobilidade Cooperativa Descentralizada

MVP de um sistema de mobilidade urbana baseado em rede P2P e blockchain, sem intermediários centralizados.

## Arquitetura

- **Passageiro App**: Busca motoristas, solicita viagens e valida presença via QR Code
- **Motorista App**: Anuncia disponibilidade, aceita viagens e gera QR Codes de validação
- **P2P Network**: Comunicação direta entre passageiros e motoristas (simulada no MVP)
- **Smart Contracts**: Pagamentos e governança descentralizada (simulada no MVP)

## Funcionalidades Implementadas

### App do Passageiro
- ✅ Busca de motoristas próximos via P2P
- ✅ Visualização de perfil, nível e taxa do motorista
- ✅ Solicitação de viagem
- ✅ Validação de presença via QR Code durante viagem
- ✅ Finalização de viagem e processamento de pagamento via blockchain

### App do Motorista
- ✅ Sistema de níveis e XP (Iniciante/Intermediário/Veterano)
- ✅ Anúncio de disponibilidade na rede P2P
- ✅ Recebimento de solicitações de passageiros
- ✅ Geração de QR Code para validação de presença
- ✅ Finalização de viagem e recebimento de pagamento
- ✅ Taxas progressivas baseadas em nível (15% -> 10% -> 5%)

## Requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (para gerar APKs) ou Expo EAS

## Instalação

```bash
# Instalar dependências de todos os projetos
npm run install:all

# Ou instalar individualmente
cd passenger-app && npm install
cd ../driver-app && npm install
```

## Executar em Desenvolvimento

```bash
# App do Passageiro
npm run start:passenger

# App do Motorista
npm run start:driver
```

## Gerar APKs

### Método 1: Expo EAS (Recomendado)

```bash
# Configurar EAS
npm install -g eas-cli
eas login

# Build do App do Passageiro
cd passenger-app
eas build --platform android --profile production

# Build do App do Motorista
cd ../driver-app
eas build --platform android --profile production
```

### Método 2: Build Local

```bash
# Instalar Expo CLI
npm install -g expo-cli

# Gerar APK do Passageiro
cd passenger-app
expo build:android

# Gerar APK do Motorista
cd ../driver-app
expo build:android
```

## Estrutura do Projeto

```
zubi/
├── passenger-app/          # App do Passageiro
│   ├── src/
│   │   ├── screens/       # Telas do app
│   │   └── services/      # Serviços P2P e blockchain
│   ├── App.js
│   └── package.json
├── driver-app/            # App do Motorista
│   ├── src/
│   │   ├── screens/       # Telas do app
│   │   └── services/      # Serviços de motorista
│   ├── App.js
│   └── package.json
└── package.json           # Scripts principais
```

## Sistema de Taxas

- **Iniciante** (0-500 XP): 15% de taxa
- **Intermediário** (500-1000 XP): 10% de taxa
- **Veterano** (1000+ XP): 5% de taxa

Motoristas ganham 10 XP por viagem completada.

## Protocolo PMCD

Baseado no documento zubi.txt, este MVP implementa:

1. **Matchmaking P2P**: Descoberta descentralizada de motoristas
2. **Validação de Presença**: QR Codes para provar presença durante viagem
3. **Pagamento via Smart Contract**: Processamento automático de pagamento
4. **Economia de Governança**: Sistema de XP e taxas progressivas

## Limitações do MVP

Para simplificar o MVP, algumas funcionalidades foram simuladas:

- Rede P2P (libp2p) simulada com dados mock
- Smart contracts simulados (sem blockchain real)
- Nostr não implementado (seria usado para anúncio de motoristas)
- Bluetooth para validação não implementado (usa QR Code apenas)
- Tribunal descentralizado não implementado
- Trabalho de oráculo não implementado

## Próximos Passos

1. Integrar libp2p para rede P2P real
2. Implementar smart contracts em Polygon/Arbitrum
3. Adicionar Nostr para descoberta de motoristas
4. Implementar validação via Bluetooth
5. Adicionar sistema de reputação e tribunal descentralizado
6. Implementar trabalho de oráculo
7. Adicionar credenciais verificáveis (DID)

## Licença

MIT
