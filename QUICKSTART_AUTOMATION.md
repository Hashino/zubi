# 🚀 Guia Rápido: Automatizar Publicação na Play Store

## 📋 Visão Geral

Para automatizar a publicação, você precisa:
1. ✅ Criar apps na Play Console (5 min)
2. ✅ Configurar Google Service Account (10 min)
3. ✅ Adicionar secrets no GitHub (2 min)
4. ✅ Fazer primeiro upload manual (30-60 min)
5. ✅ Testar automação (5 min)

**Tempo total**: ~1-2 horas (na primeira vez)

---

## 📚 Guias Detalhados

Siga os guias nesta ordem:

### 1. [SETUP_SERVICE_ACCOUNT.md](./SETUP_SERVICE_ACCOUNT.md) 
Criar e configurar Google Service Account para publicação automática.

**O que você vai fazer:**
- Criar service account na Google Cloud
- Baixar arquivo JSON com credenciais
- Vincular à Play Console com permissões corretas
- Adicionar ao GitHub Secrets

### 2. [SETUP_EXPO_TOKEN.md](./SETUP_EXPO_TOKEN.md)
Obter e configurar token do Expo para builds automáticos.

**O que você vai fazer:**
- Gerar EXPO_TOKEN
- Adicionar ao GitHub Secrets

### 3. [FIRST_UPLOAD.md](./FIRST_UPLOAD.md)
Fazer primeiro upload manual (obrigatório pela Play Store).

**O que você vai fazer:**
- Preencher informações do app (descrição, ícone, screenshots)
- Buildar AAB de produção
- Fazer upload na Play Console
- Aguardar aprovação (1-7 dias)

---

## ⚡ TL;DR (Resumo Executivo)

Se você já sabe o que está fazendo:

```bash
# 1. Criar apps na Play Console
# - com.zubi.passenger
# - com.zubi.driver

# 2. Criar Service Account
# Google Cloud Console > IAM & Admin > Service Accounts
# Download JSON > Add to Play Console with "Manage testing track releases"

# 3. Adicionar secrets no GitHub
# https://github.com/Hashino/zubi/settings/secrets/actions
# - EXPO_TOKEN (do expo.dev)
# - GOOGLE_SERVICE_ACCOUNT_JSON (arquivo JSON completo)

# 4. Build e upload manual
cd passenger-app
eas build --platform android --profile production
# Baixar .aab e fazer upload na Play Console > Internal testing

cd ../driver-app
eas build --platform android --profile production
# Baixar .aab e fazer upload na Play Console > Internal testing

# 5. Testar automação
git commit -m "feat: test CI/CD"
git push origin main
# GitHub Actions vai buildar e publicar automaticamente!
```

---

## 🎯 Depois da Configuração

Uma vez configurado, o workflow automático funciona assim:

### Push para `main`:
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

**O que acontece:**
1. ⚡ GitHub Actions detecta push
2. 🏗️ Faz build no EAS (~10-15 min)
3. 📱 Incrementa versão automaticamente
4. 🚀 Publica no Internal Testing da Play Store
5. ✅ App atualizado em poucos minutos!

### Build Manual:
1. GitHub > Actions
2. Selecione workflow "EAS Build & Deploy"
3. Run workflow
4. Escolha profile (preview/production)
5. Escolha se quer publicar (true/false)

---

## 🐛 Problemas Comuns

| Erro | Solução |
|------|---------|
| "Invalid credentials" | Verifique EXPO_TOKEN no GitHub Secrets |
| "Service account doesn't have permission" | Marque "Manage testing track releases" na Play Console |
| "Version code already used" | CI/CD incrementa automaticamente (verifique autoIncrement no eas.json) |
| "Package name mismatch" | Deve ser `com.zubi.passenger` ou `com.zubi.driver` |
| Build fails | Veja logs em: https://github.com/Hashino/zubi/actions |

---

## 📊 Status Atual

### ✅ O que já está configurado:
- GitHub Actions workflows criados
- eas.json configurado para automação
- .gitignore protegendo secrets
- Documentação completa

### ⏳ O que você precisa fazer:
1. Criar apps na Play Console
2. Configurar Service Account (seguir SETUP_SERVICE_ACCOUNT.md)
3. Adicionar secrets no GitHub (EXPO_TOKEN + GOOGLE_SERVICE_ACCOUNT_JSON)
4. Fazer primeiro upload manual (seguir FIRST_UPLOAD.md)

### 🚀 Depois disso:
- Automação completa funcionando
- Push para main = publicação automática
- Sem intervenção manual necessária

---

## 🔗 Links Úteis

- **Repositório**: https://github.com/Hashino/zubi
- **GitHub Actions**: https://github.com/Hashino/zubi/actions
- **Settings/Secrets**: https://github.com/Hashino/zubi/settings/secrets/actions
- **Play Console**: https://play.google.com/console/
- **Google Cloud Console**: https://console.cloud.google.com/
- **Expo Dashboard**: https://expo.dev/accounts/hashino/projects

---

## 💡 Dicas

- **Teste primeiro no Internal Testing** antes de promover para produção
- **Monitore os logs** do GitHub Actions para ver o progresso
- **Primeira aprovação demora** (1-7 dias), depois é automático
- **Versões incrementam automaticamente**, não precisa editar manualmente
- **Guarde o arquivo JSON** da service account em local seguro (não commitar!)

---

## 🆘 Precisa de Ajuda?

1. Veja os guias detalhados acima
2. Confira [CI_CD_SETUP.md](./CI_CD_SETUP.md) para troubleshooting
3. Veja logs do GitHub Actions: https://github.com/Hashino/zubi/actions
4. Veja logs do EAS: https://expo.dev/accounts/hashino/projects

---

**Próximo passo**: Comece pelo [SETUP_SERVICE_ACCOUNT.md](./SETUP_SERVICE_ACCOUNT.md)! 🚀
