# Zubi - TODO List

## 🔴 CRITICAL (Para MVP funcional)

### Passenger App
- [ ] **TODO**: Re-implementar QR code scanner para validação de presença
  - Arquivo: `passenger-app/src/screens/TripScreen.js`
  - Atualmente usando validação simulada (botão)
  - Necessário: Usar `expo-camera` + `CameraView` para escanear QR
  
- [ ] **FIX**: Corrigir versão do react-native
  - Atual: 0.73.0
  - Esperado: 0.73.6
  - Comando: `npx expo install --fix`

### Driver App
- [ ] **BLOCKER**: Criar projeto EAS
  - Ver instruções em [BUILD_STATUS.md](./BUILD_STATUS.md)
  - Necessário para gerar APK

## 🟡 HIGH PRIORITY (Para Produção)

### P2P Networking
- [ ] **TODO**: Implementar rede P2P real
  - Arquivo: `passenger-app/src/services/P2PService.js`
  - Arquivo: `driver-app/src/services/DriverService.js`
  - Opções: libp2p, Nostr, Gun.js
  - Atual: Mock/simulação

- [ ] **TODO**: Adicionar descoberta de peers via DHT
  - Permitir encontrar motoristas próximos sem servidor central
  
- [ ] **TODO**: Implementar comunicação P2P criptografada
  - Usar noise protocol ou similar

### Blockchain Integration
- [ ] **TODO**: Integrar smart contracts reais
  - Atualmente: Simulação de blockchain
  - Alvo: Polygon ou Arbitrum
  - Implementar: Pagamentos, taxa progressiva, disputas

- [ ] **TODO**: Adicionar wallet integration
  - MetaMask mobile ou WalletConnect
  - Gerenciar chaves privadas seguramente

- [ ] **TODO**: Implementar oracle system
  - GPS oracles para validação de distância
  - Reputation oracles

### Presence Validation
- [ ] **TODO**: Implementar Bluetooth proximity
  - Validação adicional de presença física
  - Fallback para quando QR não funcionar

- [ ] **TODO**: Adicionar validação de localização
  - Verificar se passageiro está próximo ao motorista
  - Prevenir fraudes

### Maps & Navigation  
- [ ] **TODO**: Adicionar react-native-maps
  - Remov ido para simplificar MVP
  - Necessário para mostrar rota e localização

- [ ] **TODO**: Implementar navegação turn-by-turn
  - Integração com Google Maps / OpenStreetMap

### Governance
- [ ] **TODO**: Implementar sistema de tribunal
  - Disputas entre passageiros e motoristas
  - Votação descentralizada
  
- [ ] **TODO**: Sistema de reputação on-chain
  - Reviews verificáveis
  - Histórico imutável

### Identity & Credentials
- [ ] **TODO**: Implementar DIDs (Decentralized Identifiers)
  - Identidade soberana para usuários
  
- [ ] **TODO**: Credenciais verificáveis
  - CNH, documentos, certificações
  - Usar Verifiable Credentials spec

## 🟢 NICE TO HAVE (Melhorias futuras)

### UI/UX
- [ ] Adicionar splash screen e ícone customizados
- [ ] Melhorar animações e transições
- [ ] Modo escuro
- [ ] Suporte a múltiplos idiomas (i18n)
- [ ] Acessibilidade (a11y)

### Features
- [ ] Viagens agendadas
- [ ] Viagens compartilhadas (carpool)
- [ ] Chat entre passageiro e motorista
- [ ] Histórico de viagens
- [ ] Estatísticas e analytics
- [ ] Programa de recompensas/fidelidade
- [ ] Integração com calendário
- [ ] SOS / Botão de emergência

### Performance
- [ ] Otimização de bundle size
- [ ] Code splitting
- [ ] Lazy loading de componentes
- [ ] Caching de dados
- [ ] Offline mode

### DevOps
- [ ] CI/CD pipeline
- [ ] Testes automatizados (Jest, Detox)
- [ ] Monitoring (Sentry)
- [ ] Analytics (Mixpanel, Amplitude)
- [ ] A/B testing

## 🐛 KNOWN BUGS

### Passenger App
- **BUG**: Duplicate function `handleValidatePresence` (FIXED)
  - Status: ✅ Resolvido no commit c28f30c
  
- **BUG**: expo-camera removido temporariamente
  - Motivo: Causava falhas no build
  - Status: Re-adicionado, aguardando teste de build

### Driver App
- **BUG**: EAS project não configurado
  - Status: Aguardando criação manual do projeto

## 📝 DOCUMENTATION NEEDED

- [ ] API documentation (se houver backend)
- [ ] Smart contract documentation
- [ ] P2P protocol specification
- [ ] Architecture Decision Records (ADRs)
- [ ] User guides (passageiro e motorista)
- [ ] Developer setup guide
- [ ] Contributing guidelines

## 🔒 SECURITY

- [ ] Security audit do código
- [ ] Penetration testing
- [ ] Smart contract audit
- [ ] Key management review
- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR/LGPD compliance

## 🧪 TESTING

- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Detox)
- [ ] Smart contract tests (Hardhat)
- [ ] P2P network tests
- [ ] Load testing
- [ ] Beta testing com usuários reais

---

**Última atualização**: 08/02/2026
