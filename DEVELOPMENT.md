# Guia de Desenvolvimento Zubi

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js 18+
- JDK 17
- Android SDK
- Dispositivo Android para testes

### Instalação de Dependências

```bash
# Driver app
cd driver-app
npm install

# Passenger app
cd passenger-app
npm install
```

## Build de Debug (APK para teste sem Metro)

Para gerar APKs que funcionam sem o Metro bundler (standalone):

```bash
# Driver app
cd driver-app/android
JAVA_HOME=~/.local/jdk/jdk-17.0.2 ./gradlew assembleDebug --no-daemon

# Passenger app
cd passenger-app/android
JAVA_HOME=~/.local/jdk/jdk-17.0.2 ./gradlew assembleDebug --no-daemon
```

Os APKs serão gerados em:
- `driver-app/android/app/build/outputs/apk/debug/app-debug.apk`
- `passenger-app/android/app/build/outputs/apk/debug/app-debug.apk`

Para instalar no dispositivo:
```bash
adb install -r driver-app/android/app/build/outputs/apk/debug/app-debug.apk
adb install -r passenger-app/android/app/build/outputs/apk/debug/app-debug.apk
```

## Desenvolvimento com Metro Bundler

### Configuração de Portas

Cada app usa uma porta diferente para evitar conflitos:
- **Driver app**: Porta 8091
- **Passenger app**: Porta 8092

As portas são configuradas no arquivo `app.json` de cada projeto:
```json
{
  "expo": {
    "packagerOpts": {
      "port": 8091
    }
  }
}
```

### Iniciar Metro Bundler

```bash
# Terminal 1 - Driver app (porta 8091)
cd driver-app
npx expo start --port 8091

# Terminal 2 - Passenger app (porta 8092)
cd passenger-app
npx expo start --port 8092
```

### Configurar Reverse ADB

O-reverse ADB permite que o dispositivo Android acesso o Metro bundler no computador:

```bash
# Remover configurações anteriores
adb reverse --remove-all

# Configurar reverse para cada app
adb reverse tcp:8091 tcp:8091
adb reverse tcp:8092 tcp:8092

# Verificar configuração
adb reverse --list
```

### Instalar APK de Debug

```bash
# Driver app
adb install -r driver-app/android/app/build/outputs/apk/debug/app-debug.apk

# Passenger app
adb install -r passenger-app/android/app/build/outputs/apk/debug/app-debug.apk
```

### Fluxo de Desenvolvimento

1. Iniciar Metro bundler para ambos os apps (em terminais separados)
2. Configurar reverse ADB
3. Instalar APK de debug no dispositivo
4. Os apps devem automaticamente conectar ao Metro bundler
5. Qualquer alteração no código JavaScript será recarregada automaticamente

### Resolução de Problemas

#### "Unable to load script. Make sure you're either running Metro"
- Verificar se o Metro está rodando: `curl localhost:8091`
- Verificar reverse ADB: `adb reverse --list`
- Rebuildar o APK de debug após mudanças no app.json

#### Porta já em uso
```bash
# Encontrar processo usando a porta
lsof -i :8091

# Matar processo
kill -9 <PID>
```

## Build de Release (APK standalone com JS bundled)

```bash
# Driver app
cd driver-app/android
JAVA_HOME=~/.local/jdk/jdk-17.0.2 ./gradlew assembleRelease --no-daemon

# Passenger app
cd passenger-app/android
JAVA_HOME=~/.local/jdk/jdk-17.0.2 ./gradlew assembleRelease --no-daemon
```

Os APKs de release serão gerados em:
- `driver-app/android/app/build/outputs/apk/release/`
- `passenger-app/android/app/build/outputs/apk/release/`

## Estrutura do Projeto

```
zubi/
├── driver-app/          # App do motorista (Expo/React Native)
├── passenger-app/       # App do passageiro (Expo/React Native)
├── shared/              # Código compartilhado entre apps
│   ├── components/      # Componentes React Native
│   │   ├── OSMMapView.js    # Mapa OpenStreetMap (react-native-maps)
│   │   └── OSMMapWeb.js     # Mapa OpenStreetMap (WebView)
│   └── services/        # Serviços compartilhados
│       └── NostrService.js  # Serviço Nostr P2P
└── ...
```

## Notas

- O OpenStreetMap é implementado via WebView (react-native-webview)
- O Google Maps não é usado para evitar necessidade de API key
- O driver-app e passenger-app usam portas diferentes para permitir desenvolvimento simultâneo
