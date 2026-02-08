# CI/CD Setup Guide - Zubi

Este guia explica como configurar CI/CD completo para build e publicação automática na Google Play Store usando GitHub Actions e EAS.

## 📋 Pré-requisitos

- [ ] Repositório GitHub com o código do Zubi
- [ ] Conta Expo (já configurada)
- [ ] Conta Google Play Console
- [ ] Apps criados na Play Console (Passenger e Driver)

## 🔧 Configuração Passo a Passo

### 1. Obter EXPO_TOKEN

O token permite que o GitHub Actions faça build via EAS:

```bash
# Gerar token de acesso
eas whoami
# Se não estiver logado: eas login

# Criar token
npx expo login
```

Ou criar via web:
1. Acesse https://expo.dev/accounts/[seu-username]/settings/access-tokens
2. Clique em "Create Token"
3. Nome: `GitHub Actions CI/CD`
4. Copie o token (só aparece uma vez!)

### 2. Configurar Google Service Account

Para publicar na Play Store automaticamente, você precisa de uma Service Account:

#### 2.1. Criar Service Account na Google Cloud

1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto ou selecione existente
3. Vá em "IAM & Admin" > "Service Accounts"
4. Clique em "Create Service Account"
5. Nome: `eas-play-store-publisher`
6. Clique em "Create and Continue"
7. Em "Grant this service account access to project":
   - **Não adicione roles aqui**, faremos na Play Console
8. Clique em "Done"
9. Clique na service account criada
10. Aba "Keys" > "Add Key" > "Create New Key"
11. Tipo: **JSON**
12. Baixe o arquivo JSON (será algo como `project-name-xxxxx.json`)

#### 2.2. Vincular Service Account à Play Console

1. Abra https://play.google.com/console/
2. Selecione seu app (ou todos os apps)
3. Menu lateral: **"Users and permissions"** > **"Invite new users"**
4. Cole o email da service account (formato: `eas-play-store-publisher@project-name.iam.gserviceaccount.com`)
5. Em "App permissions":
   - Selecione os apps (Zubi Passenger e Zubi Driver)
   - Marque as permissões:
     - ✅ **View app information**
     - ✅ **Manage production releases**
     - ✅ **Manage testing track releases** (IMPORTANTE!)
6. Em "Account permissions":
   - **Não marque nada** (evite dar permissões administrativas)
7. Clique em "Invite user"
8. A service account receberá acesso imediatamente (sem email de confirmação)

### 3. Adicionar Secrets no GitHub

1. Vá no seu repositório GitHub
2. Settings > Secrets and variables > Actions
3. Clique em "New repository secret"

Adicione os seguintes secrets:

#### Secret 1: EXPO_TOKEN
- Name: `EXPO_TOKEN`
- Value: Cole o token do Expo gerado no passo 1

#### Secret 2: GOOGLE_SERVICE_ACCOUNT_JSON
- Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
- Value: Cole o **conteúdo completo** do arquivo JSON da service account

### 4. Criar Apps na Play Console

Se ainda não criou os apps:

#### App 1: Zubi Passageiro
1. Play Console > "Create app"
2. Nome: **Zubi Passageiro**
3. Default language: Português (Brasil)
4. App or game: App
5. Free or paid: Free
6. Aceite os termos
7. Package name: `com.zubi.passenger` (deve bater com app.json)

#### App 2: Zubi Motorista
1. Repita o processo
2. Nome: **Zubi Motorista**
3. Package name: `com.zubi.driver`

### 5. Configurar Service Account nos Apps

Para **cada app**, adicione o arquivo da service account:

#### Opção A: Via EAS (Recomendado)

```bash
# Passenger App
cd passenger-app
eas submit --platform android

# Siga o prompt interativo:
# 1. Select: "Google Service Account (JSON key file path)"
# 2. Caminho: ./google-service-account.json
```

#### Opção B: Manualmente no Projeto

1. Copie o arquivo JSON para cada pasta:
```bash
cp google-service-account.json passenger-app/
cp google-service-account.json driver-app/
```

2. Adicione ao .gitignore:
```bash
echo "google-service-account.json" >> .gitignore
```

**IMPORTANTE**: Nunca commite este arquivo! Use GitHub Secrets.

### 6. Fazer Upload Inicial Manual

A Play Store requer que o primeiro upload seja manual:

```bash
# Build production (gera .aab)
cd passenger-app
eas build --platform android --profile production

# Aguarde o build terminar
# Baixe o .aab do link fornecido

# Faça upload manual na Play Console:
# 1. Play Console > App > Testing > Internal testing
# 2. Create new release
# 3. Upload o .aab
# 4. Preencha release notes
# 5. Save and publish
```

Repita para o driver-app.

### 7. Testar CI/CD

Agora o CI/CD está pronto! Teste:

#### Teste 1: Build Automático (não publica)
```bash
git add .
git commit -m "test: trigger CI/CD build"
git push origin master
```

Isso vai:
- ✅ Rodar GitHub Actions
- ✅ Fazer build no EAS
- ❌ **NÃO** vai publicar (apenas PRs e pushes em branches secundárias)

#### Teste 2: Build + Publicação Automática
```bash
# Fazer merge na master ativa a publicação automática
git checkout -b feature/teste
git add .
git commit -m "feat: nova funcionalidade"
git push origin feature/teste

# Crie PR e faça merge para master
# Após merge, vai buildar E publicar na Play Store (Internal Testing)
```

#### Teste 3: Build Manual Via Interface
1. GitHub > Actions
2. Selecione workflow "EAS Build & Deploy"
3. Clique em "Run workflow"
4. Escolha:
   - Branch: master
   - Profile: production
   - Submit to Play Store: ✅ true
5. Run!

## 🎯 Como Funciona

### Triggers Automáticos

| Evento | Build? | Publica? | Track |
|--------|--------|----------|-------|
| Push em feature branch | ✅ Preview | ❌ Não | - |
| Pull Request | ✅ Preview | ❌ Não | - |
| Merge na master | ✅ Production | ✅ Sim | Internal Testing |
| Manual (interface) | ✅ Configurável | ✅ Opcional | Internal Testing |

### Perfis de Build

- **development**: APK debug com hot reload
- **preview**: APK para testers (não vai para Play Store)
- **production**: AAB (Android App Bundle) para Play Store

### Tracks da Play Store

O CI/CD publica no track **Internal Testing** por padrão. Para promover:

1. Play Console > Testing > Internal testing
2. Selecione a release
3. "Promote release" > escolha:
   - **Closed testing (Alpha/Beta)**: Para testadores específicos
   - **Open testing**: Para público geral (mas limitado)
   - **Production**: Para todos os usuários

## 🔐 Segurança

### O que NÃO commitar:
- ❌ `google-service-account.json`
- ❌ `*.keystore` / `*.jks`
- ❌ `.env` files com secrets
- ❌ EXPO_TOKEN em texto plano

### Boas Práticas:
- ✅ Use GitHub Secrets para credenciais
- ✅ Rotacione tokens periodicamente
- ✅ Use service accounts específicas (não sua conta pessoal)
- ✅ Limite permissões ao mínimo necessário
- ✅ Monitore logs de acesso da service account

## 🐛 Troubleshooting

### Erro: "Experience with id 'xxx' does not exist"
- **Solução**: Configure o EAS project ID em `app.json`
- Ver: [BUILD_STATUS.md](./BUILD_STATUS.md)

### Erro: "Invalid credentials"
- **Solução**: Verifique se o `EXPO_TOKEN` está correto no GitHub Secrets
- Regenere o token se necessário

### Erro: "Service account doesn't have permission"
- **Solução**: Verifique permissões na Play Console
- Garanta que marcou "Manage testing track releases"

### Erro: "Package name mismatch"
- **Solução**: O `package` em `app.json` deve bater com o da Play Console
- Passenger: `com.zubi.passenger`
- Driver: `com.zubi.driver`

### Erro: "Version code already used"
- **Solução**: Incrementar `versionCode` em `app.json`
- Ou use `autoIncrement: true` no `eas.json` (já configurado)

### Build fica travado em "Waiting..."
- **Solução**: Verifique fila no EAS Dashboard
- Free tier tem limite de builds simultâneos

## 📊 Monitoramento

Após configurar, monitore:

1. **GitHub Actions**: https://github.com/[seu-usuario]/zubi/actions
2. **EAS Builds**: https://expo.dev/accounts/hashino/projects
3. **Play Console Releases**: https://play.google.com/console/

## 🚀 Próximos Passos

Após configurar:

- [ ] Configure notificações do GitHub Actions (email/Slack)
- [ ] Adicione badges de status no README
- [ ] Configure testes automáticos antes do build
- [ ] Configure changelog automático
- [ ] Configure screenshots automáticos
- [ ] Configure rollout gradual (10% > 50% > 100%)

## 📚 Referências

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [GitHub Actions for Expo](https://docs.expo.dev/build/building-on-ci/)
- [Google Play Service Accounts](https://developers.google.com/android-publisher/getting_started)

---

**Dúvidas?** Abra uma issue no repositório.
