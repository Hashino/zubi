# Zubi - Guia de CI/CD e Publicação

Este guia explica como configurar publicação automática na Google Play Store usando GitHub Actions, EAS e Google Play Console.

## Visão Geral da Arquitetura

```
GitHub (push) → GitHub Actions → EAS Build → Google Play Store
                ↓
           Expo EAS
           ↓
        APKs gerados
```

## Pré-requisitos

1. **Conta GitHub** - Para GitHub Actions
2. **Conta Expo** - Para EAS Build (gratuito)
3. **Conta Google Play Console** - Para publicar apps ($25 uma única vez)
4. **npm** - Instalado localmente

---

## Passo 1: Configurar Expo (EAS)

### 1.1 Criar conta Expo

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login com sua conta Expo
eas login
```

### 1.2 Configurar projeto

```bash
# Driver app
cd driver-app
eas project:create
# Nome do projeto: zubi-driver

# Passenger app
cd passenger-app
eas project:create
# Nome do projeto: zubi-passenger
```

### 1.3 Gerar tokens de acesso

```bash
# Gerar token Expo (para GitHub Actions)
eas token:create
```

Guarde o token exibido. Você vai usá-lo no GitHub Secrets.

---

## Passo 2: Configurar Google Play Console

### 2.1 Criar projeto na Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto: "Zubi"
3. Anote o **Project ID**

### 2.2 Habilitar Google Play Android Developer API

1. Vá em "APIs & Services" → "Library"
2. Pesquise "Google Play Android Developer API"
3. Clique em "Enable"

### 2.3 Criar Service Account

1. Vá em "IAM & Admin" → "Service Accounts"
2. Clique em "Create Service Account"
3. Nome: `eas-build`
4. Role: "Service Account User"
5. Na seção "Keys", crie uma chave JSON
6. Baixe o arquivo `.json` e guarde-o com segurança

### 2.4 Vincular ao Google Play Console

1. Acesse: https://play.google.com/console/
2. Selecione seu app
3. Vá em "Release" → "Setup" → "API Access"
4. Clique em "Link a Google Cloud project"
5. Selecione o projeto criado no passo 2.1
6. Na seção "Service Accounts", adicione a service account criada

### 2.5 Configurar OAuth (para primeiro upload)

Para o primeiro upload de cada app, você precisa fazer manualmente:

1. Acesse Google Play Console
2. Vá em "Release" → "App releases"
3. Faça upload do primeiro APK manualmente
4. Depois disso, o CI/CD pode publicar automaticamente

---

## Passo 3: Configurar GitHub Secrets

No seu repositório GitHub, vá em **Settings** → **Secrets and variables** → **Actions** e adicione:

### Secrets obrigatórios:

| Nome | Valor |
|------|-------|
| `EXPO_TOKEN` | Token gerado no passo 1.3 |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Conteúdo completo do arquivo JSON da service account |
| `GOOGLE_PLAY_PACKAGE_NAME_DRIVER` | `com.zubi.driver` |
| `GOOGLE_PLAY_PACKAGE_NAME_PASSENGER` | `com.zubi.passenger` |

---

## Passo 4: Configurar GitHub Actions

Crie os arquivos de workflow:

### 4.1 Workflow do Driver App

```yaml
# .github/workflows/driver-android.yml
name: Build Driver App

on:
  push:
    branches: [main, dev]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd driver-app
          npm ci

      - name: Build Android App
        run: |
          cd driver-app
          eas build --platform android --profile production --non-interactive

      - name: Upload to Google Play
        uses: r0adkll/upload-google-play@v1
        with:
          service-account-json: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          package-name: ${{ secrets.GOOGLE_PLAY_PACKAGE_NAME_DRIVER }}
          release-files: ./driver-app/android/app/build/outputs/apk/release/*.apk
          track: internal
          status: completed
```

### 4.2 Workflow do Passenger App

```yaml
# .github/workflows/passenger-android.yml
name: Build Passenger App

on:
  push:
    branches: [main, dev]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd passenger-app
          npm ci

      - name: Build Android App
        run: |
          cd passenger-app
          eas build --platform android --profile production --non-interactive

      - name: Upload to Google Play
        uses: r0adkll/upload-google-play@v1
        with:
          service-account-json: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          package-name: ${{ secrets.GOOGLE_PLAY_PACKAGE_NAME_PASSENGER }}
          release-files: ./passenger-app/android/app/build/outputs/apk/release/*.apk
          track: internal
          status: completed
```

### 4.3 Workflow combinado (opcional)

```yaml
# .github/workflows/build-all.yml
name: Build All Apps

on:
  push:
    branches: [main, dev]
    paths:
      - 'driver-app/**'
      - 'passenger-app/**'
      - 'shared/**'
  workflow_dispatch:

jobs:
  driver:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd driver-app && npm ci
      - run: cd driver-app && eas build --platform android --profile production --non-interactive
      - uses: actions/upload-artifact@v3
        with:
          name: driver-apk
          path: driver-app/android/app/build/outputs/apk/release/*.apk

  passenger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd passenger-app && npm ci
      - run: cd passenger-app && eas build --platform android --profile production --non-interactive
      - uses: actions/upload-artifact@v3
        with:
          name: passenger-apk
          path: passenger-app/android/app/build/outputs/apk/release/*.apk
```

---

## Passo 5: Configurar EAS Build (eas.json)

### 5.1 Driver app

```json
{
  "build": {
    "production": {
      "android": {
        "image": "ubuntu-latest",
        "distribution": "internal"
      },
      "env": {
        "EXPO_NO_TELEMETRY": "1"
      }
    }
  }
}
```

### 5.2 Passenger app

```json
{
  "build": {
    "production": {
      "android": {
        "image": "ubuntu-latest",
        "distribution": "internal"
      },
      "env": {
        "EXPO_NO_TELEMETRY": "1"
      }
    }
  }
}
```

---

## Como funciona o fluxo

### Fluxo de desenvolvimento:

1. **Desenvolvedor faz push** para `main` ou `dev`
2. **GitHub Actions** dispara automaticamente
3. **EAS Build** compila o app (pode levar 5-15 min)
4. **APK gerado** e publicado na Google Play Console (track: internal)
5. **Testadores** recebem APK via Google Play Console interno

### Tracks disponíveis:

| Track | Descrição | Público? |
|-------|-----------|----------|
| `internal` | Testers internos | Não |
| `alpha` | Testers Alpha | Não |
| `beta` | Testers Beta | Não |
| `production` | Público geral | Sim |

---

## Troubleshooting

### "EXPO_TOKEN is missing"

Solution: Adicione o secret `EXPO_TOKEN` no GitHub

### "Service account not found"

Solution: Verifique se a service account foi adicionada no Google Play Console → API Access

### "APK not found"

Solution: Verifique o caminho do APK no workflow. O EAS gera em:
- `android/app/build/outputs/apk/release/`

### "Track not found"

Solution: Use `internal`, `alpha`, `beta` ou `production`

---

## Comandos úteis

```bash
# Login no Expo
eas login

# Ver projetos
eas project:list

# Ver builds
eas build:list

# Build local (para teste)
cd driver-app
eas build --platform android --profile development --local

# Verificar configuração
eas build:configure
```

---

## Limites gratuitos do EAS

| Plano | Builds/month | Minutos/build |
|-------|--------------|---------------|
| Free | 30 | 30 |
| $25/mo | 250 | 60 |

Para uso intensivo, considere o plano pago ou faça builds locais.
