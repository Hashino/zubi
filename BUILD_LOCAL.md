# Build Local e Publicação

## Problema Resolvido

O EAS Build tem limite de builds gratuitos por mês. Para continuar desenvolvendo sem custos, configuramos **builds locais** mantendo a **publicação automatizada gratuita**.

## O Que Mudou

### Antes
- Build na nuvem EAS (limitado no plano Free)
- `npm run build:passenger` ou `npm run build:driver`

### Agora
- Build local na sua máquina (ilimitado e grátis)
- Publicação continua automática via EAS Submit (grátis)
- `npm run build:local:passenger` ou `npm run build:local:driver`

## Pré-requisitos

### 1. Android Studio e SDK
```bash
# Instalar Android Studio
# Download: https://developer.android.com/studio

# Configurar variáveis de ambiente no ~/.bashrc ou ~/.zshrc:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

### 2. JDK 17
```bash
# Ubuntu/Debian
sudo apt install openjdk-17-jdk

# Verificar
java -version
```

### 3. Credenciais do Google Play
Certifique-se de que existe o arquivo `google-service-account.json` em:
- `passenger-app/google-service-account.json`
- `driver-app/google-service-account.json`

## Como Usar

### Build e Publicação Completa

**App Passageiro:**
```bash
npm run build:local:passenger
```

**App Motorista:**
```bash
npm run build:local:driver
```

Isso vai:
1. ✅ Incrementar versão automaticamente
2. ✅ Fazer build local (gera .aab)
3. ✅ Publicar no Google Play Console (como rascunho)

### Apenas Incrementar Versão

```bash
npm run version:passenger
npm run version:driver
```

## Estrutura dos Scripts

### `scripts/increment-version.js`
- Incrementa o número da versão no `app.json`
- Exemplo: `1.0.0` → `1.0.1`

### `scripts/build-and-submit.sh`
Script completo que:
1. Incrementa a versão
2. Faz prebuild (se necessário)
3. Compila o app bundle (.aab)
4. Publica no Google Play

## Perfis de Build

### `eas.json` - Novos Perfis

**production-local**: Build local para produção
```json
{
  "android": {
    "buildType": "app-bundle",
    "gradleCommand": ":app:bundleRelease"
  },
  "distribution": "internal"
}
```

## Vantagens

✅ **Grátis**: Sem limite de builds
✅ **Rápido**: Build local é mais rápido
✅ **Controle**: Você tem controle total do processo
✅ **Publicação**: Continua automática e gratuita via EAS Submit

## Troubleshooting

### Erro: "ANDROID_HOME não configurado"
Configure as variáveis de ambiente do Android SDK.

### Erro: "build.gradle não encontrado"
Execute `npx expo prebuild --platform android` dentro da pasta do app.

### Erro ao publicar
Verifique se o arquivo `google-service-account.json` existe e tem as permissões corretas no Google Play Console.

## Build em Nuvem (Quando Disponível)

Se quiser usar builds em nuvem quando tiver créditos:
```bash
npm run build:passenger
npm run build:driver
```

---

**Resumo**: Agora você pode desenvolver sem limites! 🚀
