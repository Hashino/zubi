# Zubi - Sistema de Corridas P2P via Nostr

## 🎉 Novo Fluxo de Corridas (Produção)

### Visão Geral

O sistema agora utiliza **100% Nostr P2P** para matchmaking de corridas, eliminando a dependência de eventos in-memory. Motoristas se candidatam para corridas publicadas por passageiros.

---

## 📱 Fluxo do Passageiro

### 1. Solicitar Corrida (SearchScreen)

**Origem:** Localização atual (automática)  
**Destino:** Passageiro digita o endereço

```
1. Abrir app → Home → "Solicitar Corrida"
2. Tela SearchScreen carrega localização atual
3. Passageiro digita destino (ex: "Praia do Canto")
4. Seleciona um resultado da busca
5. Vê estimativa: distância e valor
6. Confirma solicitação
```

**O que acontece:**
- Publica evento Nostr **Kind 30079** (ride-request)
- Tags: `#t: ride-request`, `#geohash`, `#status: searching`
- Visível para todos os motoristas online

### 2. Aguardar Candidatos (RideWaitingScreen)

**Tela de espera melhorada com UI moderna**

```
📋 Informações da Corrida
- Origem → Destino
- Distância estimada
- Valor estimado

🚗 Motoristas Disponíveis (0)
- Animação de busca
- "Aguardando motoristas se candidatarem..."
- Lista de candidatos aparece em tempo real
```

**Quando motoristas se candidatam:**
- Cards aparecem automaticamente via Nostr subscription
- Mostra: nome, veículo, placa, avaliação, nível, ETA, taxa
- Passageiro pode escolher o melhor motorista

### 3. Aceitar Motorista

```
1. Toca no card do motorista
2. Vê detalhes completos
3. Confirma aceitação
4. App publica evento Nostr Kind 1 (driver-accepted)
5. Navega para TripScreen
```

---

## 🚗 Fluxo do Motorista

### 1. Ficar Online (OnlineScreen)

```
1. Home → "Ficar Online"
2. Concede permissão de localização
3. App anuncia disponibilidade (Kind 30078)
4. Subscreve a ride-requests no Nostr
```

**Status:**
- 🟢 Online
- 📍 Localização atual
- 🎯 Nível e taxa

### 2. Ver Corridas Disponíveis

**Lista de corridas em tempo real via Nostr**

```
🔍 Corridas Disponíveis (3)

┌─────────────────────────────────┐
│ Maria Silva            ⭐ 4.8   │
│ 🔵 Praia do Canto              │
│ 🔴 Enseada do Suá              │
│                                 │
│ Valor: R$ 15,50    📏 3.2 km   │
│                                 │
│ [  Me Candidatar  ]            │
└─────────────────────────────────┘
```

**Cada card mostra:**
- Nome e avaliação do passageiro
- Origem e destino
- Distância até o passageiro
- Valor estimado da corrida
- Botão para se candidatar

### 3. Candidatar-se

```
1. Toca no card da corrida
2. Vê detalhes completos
3. Confirma candidatura
4. App publica Kind 30080 (driver-candidacy)
5. Card fica marcado como "✓ Candidatura Enviada"
```

### 4. Aguardar Aceitação

- Motorista continua vendo outras corridas
- Pode se candidatar para múltiplas corridas
- Quando passageiro aceita → recebe notificação
- Alert: "Corrida Confirmada! 🎉"
- Navega para TripScreen

---

## 🔧 Eventos Nostr

### Kind 30078 - Driver Availability
**Publicado quando:** Motorista fica online  
**Tags:** `#d: driverId`, `#t: driver-available`, `#geohash`, `#level`  
**Content:** `{ name, vehicle, rating, level, location, available, timestamp }`

### Kind 30079 - Ride Request
**Publicado quando:** Passageiro solicita corrida  
**Tags:** `#d: rideId`, `#t: ride-request`, `#geohash`, `#status: searching`  
**Content:** `{ passengerId, passengerName, origin, destination, fare, distance }`

### Kind 30080 - Driver Candidacy
**Publicado quando:** Motorista se candidata  
**Tags:** `#d: rideId_driverId`, `#t: driver-candidacy`, `#e: rideId`, `#level`  
**Content:** `{ driverId, driverName, vehicle, plate, rating, level, location, ETA }`

### Kind 1 - Driver Acceptance
**Publicado quando:** Passageiro aceita motorista  
**Tags:** `#t: driver-accepted`, `#e: rideId`, `#p: driverId`  
**Content:** `{ type: 'driver-accepted', rideId, driverId, timestamp }`

---

## 🧪 Como Testar

### Pré-requisitos
```bash
# Certifique-se de que os relays Nostr estão acessíveis
# - wss://relay.damus.io
# - wss://relay.nostr.band
# - wss://nos.lol
# - wss://relay.snort.social

# Ambos apps instalados
adb devices  # Verificar dispositivo conectado
```

### Teste End-to-End

#### 1. Preparar Driver App
```bash
# Iniciar Metro para driver
cd driver-app
PORT=8081 npx react-native start

# Em outro terminal, lançar app
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.zubi.driver/.MainActivity
```

**No dispositivo:**
1. Abrir app motorista
2. Fazer login (se necessário)
3. Ir em "Ficar Online"
4. Conceder permissão de localização
5. Ver status "🟢 Online"
6. Ver "🔍 Corridas Disponíveis (0)"

#### 2. Preparar Passenger App
```bash
# Iniciar Metro para passageiro
cd passenger-app
PORT=8082 npx react-native start

# Lançar app
adb reverse tcp:8081 tcp:8082
adb shell am start -n com.zubi.passenger/.MainActivity
```

**No dispositivo:**
1. Abrir app passageiro
2. Fazer login (se necessário)
3. Ir em "Solicitar Corrida"
4. Conceder permissão de localização
5. Ver origem preenchida automaticamente

#### 3. Solicitar Corrida (Passageiro)
1. Digitar destino: "Praia do Canto"
2. Selecionar resultado
3. Ver estimativa (ex: 3.2 km, R$ 15,50)
4. Tocar "Solicitar Corrida"
5. Confirmar
6. Ver tela de espera com animação

#### 4. Ver Corrida (Motorista)
**Trocar para app motorista**
1. Ver nova corrida aparecer na lista automaticamente
2. Ver detalhes: nome passageiro, rota, valor
3. Tocar no card
4. Ver dialog com detalhes completos
5. Tocar "Sim, candidatar"
6. Ver "✓ Candidatura Enviada"

#### 5. Aceitar Motorista (Passageiro)
**Trocar para app passageiro**
1. Ver card do motorista aparecer na lista
2. Ver: nome, veículo, placa, avaliação, nível
3. Tocar no card do motorista
4. Ver dialog de confirmação
5. Tocar "Confirmar"
6. Ver navegação para TripScreen

#### 6. Receber Aceitação (Motorista)
**Trocar para app motorista**
1. Ver alert: "Corrida Confirmada! 🎉"
2. Ver navegação para TripScreen

---

## 📊 Verificar Eventos Nostr

Você pode verificar os eventos no Nostr usando um cliente como [nostr.band](https://nostr.band):

1. Buscar por tag `#t: ride-request` para ver corridas
2. Buscar por tag `#t: driver-candidacy` para ver candidaturas
3. Buscar por tag `#t: driver-available` para ver motoristas online

---

## 🎯 Vantagens do Novo Sistema

### Para Passageiros
✅ Escolhe o motorista (não é forçado ao primeiro)  
✅ Vê múltiplos candidatos em tempo real  
✅ Compara avaliações, taxas e ETAs  
✅ Controle total sobre quem aceitar  

### Para Motoristas
✅ Vê todas as corridas disponíveis  
✅ Escolhe quais corridas pegar  
✅ Pode se candidatar para múltiplas  
✅ Não perde corrida se estiver longe  

### Técnico
✅ 100% descentralizado via Nostr  
✅ Sem servidor central necessário  
✅ Eventos persistem nos relays  
✅ Funciona após restart do app  
✅ Escalável e resiliente  

---

## 🐛 Troubleshooting

### Motorista não vê corridas
- Verificar se está "🟢 Online"
- Verificar logs: `adb logcat | grep Nostr`
- Verificar conexão com relays

### Passageiro não vê candidatos
- Verificar RideWaitingScreen está carregada
- Verificar logs para subscription
- Verificar se motorista realmente se candidatou

### Eventos não aparecem
- Aguardar ~2-3 segundos (latência de rede)
- Verificar internet do dispositivo
- Testar em relays diferentes

### Crypto errors
- Verificar que `react-native-get-random-values` está importado PRIMEIRO
- Ver `App.js` linha 1-2

---

## 🚀 Próximos Passos

### Melhorias Sugeridas
1. ✅ Integração com Google Places API (substituir mock)
2. ✅ Adicionar mapa com pins de motoristas
3. ✅ Notificações push quando candidato chega
4. ✅ Sistema de chat in-ride via Nostr DMs
5. ✅ Rating e review pós-corrida
6. ✅ Histórico de corridas via Nostr queries
7. ✅ Pagamento via Lightning Network

### Otimizações
1. Cache local de eventos Nostr
2. Geohash filtering mais preciso
3. Background location tracking
4. Reconnect automático em relays

---

## 📝 Notas Importantes

1. **Relays Nostr:** Sistema depende de relays públicos. Em produção, considere relays próprios.

2. **Chaves Privadas:** KeyManagementService deve ter chaves geradas no registro.

3. **Permissões:** Apps precisam de permissão de localização sempre.

4. **Performance:** Subscriptions consomem bateria. Otimizar para produção.

5. **Testes:** Testar em rede lenta para verificar UX com latência.

---

**Sistema implementado e testado ✅**  
**Commit:** `8276e1c`  
**Data:** $(date)
