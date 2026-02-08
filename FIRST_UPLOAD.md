# Primeiro Upload Manual na Play Store

## Por que fazer upload manual primeiro?

A Google Play Store exige que o **primeiro upload de cada app seja feito manualmente** pela interface web. Depois disso, o CI/CD pode publicar automaticamente.

---

## Passo 4.1: Buildar APK/AAB de Produção

Vamos gerar o arquivo Android App Bundle (.aab) que é o formato exigido pela Play Store.

### Para Passenger App:

```bash
cd passenger-app

# Build production (gera .aab)
eas build --platform android --profile production

# Aguarde o build terminar (leva ~10-15 minutos)
# Quando terminar, você receberá um link de download
```

### Para Driver App:

```bash
cd driver-app

# Primeiro, crie o projeto EAS se ainda não fez:
eas init
# Responda 'y' quando perguntado

# Build production
eas build --platform android --profile production

# Aguarde o build terminar
```

**Salve os links de download dos .aab!**

---

## Passo 4.2: Preparar Informações do App na Play Console

Antes de fazer upload, você precisa preencher informações básicas:

### Para Cada App (Passenger e Driver):

1. Acesse: https://play.google.com/console/
2. Selecione o app (Zubi Passageiro ou Zubi Motorista)

#### 4.2.1. App Content (Conteúdo do app)

No menu lateral, clique em **"App content"** e preencha:

**Privacy Policy (Política de Privacidade)**:
- Clique em "Start"
- URL: Você precisa de uma URL pública (pode usar GitHub Pages)
- Temporariamente, pode usar: `https://github.com/Hashino/zubi` (atualizar depois)
- Clique em "Save"

**App Access (Acesso ao app)**:
- Clique em "Start"
- Selecione: "All functionality is available without restrictions"
- Clique em "Save"

**Ads (Anúncios)**:
- Clique em "Start"  
- Selecione: "No, my app doesn't contain ads"
- Clique em "Save"

**Content Ratings (Classificação de conteúdo)**:
- Clique em "Start questionnaire"
- Email: Seu email
- Category: "Other apps"
- Responda às perguntas (todas devem ser "No" para um app de mobilidade simples)
- Clique em "Save" > "Submit"
- Aguarde (pode levar alguns minutos para processar)

**Target Audience (Público-alvo)**:
- Clique em "Start"
- Age groups: "18 and older" (ou conforme seu público)
- Clique em "Save"

**News App**:
- Clique em "Start"
- Selecione: "No, this is not a news app"
- Clique em "Save"

**COVID-19 Contact Tracing**:
- Clique em "Start"
- Selecione: "No"
- Clique em "Save"

**Data Safety (Segurança de dados)**:
- Clique em "Start"
- Preencha as informações sobre dados coletados
- Para MVP, se não coleta dados: "No data collected"
- Clique em "Save"

#### 4.2.2. Store Settings (Configurações da loja)

**App Category**:
- Main category: "Maps & Navigation"
- Tags: adicione tags relevantes

**Store Listing Contact Details**:
- Email: Seu email de contato
- Phone: (opcional)
- Website: https://github.com/Hashino/zubi

#### 4.2.3. Main Store Listing

No menu lateral, clique em **"Main store listing"**:

**App name**: (já preenchido)

**Short description** (80 caracteres):
```
Mobilidade urbana descentralizada P2P sem intermediários
```

**Full description** (até 4000 caracteres):
```
Zubi é uma plataforma de mobilidade urbana descentralizada que conecta passageiros e motoristas diretamente, sem intermediários centralizados.

🚗 Características principais:

• Sistema P2P (peer-to-peer) descentralizado
• Taxas progressivas baseadas em experiência do motorista
• Pagamentos via blockchain
• Validação de presença para segurança
• Cooperativa sem controle centralizado

💰 Taxa Progressiva:
• Motoristas iniciantes (0-500 XP): 15%
• Intermediários (500-1000 XP): 10%  
• Veteranos (1000+ XP): 5%

🔒 Segurança:
• Validação de presença durante viagem
• Histórico imutável de viagens
• Sistema de reputação transparente

Este é um MVP (Minimum Viable Product) implementando o Protocolo de Mobilidade Cooperativa Descentralizada (PMCD).

Código aberto: https://github.com/Hashino/zubi
```

**App Icon** (512x512 PNG):
- Você precisa criar um ícone
- Temporariamente, pode gerar um ícone simples em: https://icon.kitchen/
- Tema: Mobilidade/Carro + Verde (cor do Zubi: #4CAF50 para passenger, #2196F3 para driver)

**Feature Graphic** (1024x500 PNG):
- Banner que aparece no topo da página do app
- Pode criar em Canva ou Figma
- Conteúdo sugerido: Logo + "Mobilidade Descentralizada"

**Phone Screenshots** (mínimo 2, máximo 8):
- Você precisa de screenshots da interface
- Tamanho: 1080x1920 ou similar (16:9)
- **IMPORTANTE**: Se não tiver screenshots reais ainda:
  1. Rode o app no emulador
  2. Tire prints das telas principais (Home, Search, Trip)
  3. Ou use placeholders temporários

---

## Passo 4.3: Fazer Upload do AAB

Agora sim, vamos fazer o upload!

### Para Internal Testing (Recomendado para primeiro upload):

1. No menu lateral, vá em **"Testing" > "Internal testing"**

2. Clique em **"Create new release"**

3. **Upload do AAB**:
   - Clique em "Upload" no canto superior direito
   - Selecione o arquivo .aab que você baixou no passo 4.1
   - Aguarde o upload terminar

4. **Release name**: 
   - Deixe o sugerido (versão 1.0.0) ou coloque: `v1.0.0 - MVP Launch`

5. **Release notes** (em português):
```
🚀 Versão 1.0.0 - Lançamento MVP

• Sistema P2P descentralizado de mobilidade urbana
• Taxa progressiva baseada em XP do motorista
• Validação de presença durante viagem
• Interface simples e intuitiva

Primeira versão de teste do protocolo PMCD.
```

6. Clique em **"Save"**

7. Clique em **"Review release"**

8. **IMPORTANTE**: Pode aparecer erros/avisos. Comum:
   - ⚠️ "Missing privacy policy": Preencha no App Content
   - ⚠️ "Missing content rating": Preencha no App Content
   - ❌ Se aparecer erro vermelho, precisa corrigir antes

9. Se tudo OK, clique em **"Start rollout to Internal testing"**

10. Confirme: **"Rollout"**

✅ Primeiro upload completo!

### Adicionar Testadores (Internal Testing):

1. Ainda em **Internal testing**, vá na aba **"Testers"**

2. Clique em **"Create email list"**
   - List name: `Testadores Zubi`
   - Adicione emails dos testadores (pode ser só você por enquanto)
   - Clique em "Save changes"

3. Copie o **link de opt-in** que aparece

4. Abra o link no celular Android e instale o app para testar

---

## Passo 4.4: Aguardar Revisão

- ⏱️ **Primeira vez**: Pode levar de 1-7 dias para revisão
- 🔄 **Próximos uploads**: Automático via CI/CD será mais rápido (minutos)

Você receberá email quando o app for aprovado/rejeitado.

---

## Passo 4.5: Repetir para o Segundo App

Repita todo o processo para o outro app (Driver ou Passenger).

---

## Após Primeiro Upload

Depois que o primeiro upload for aprovado:

✅ **CI/CD estará totalmente funcional!**

Qualquer push para `main` vai:
1. Buildar o app automaticamente
2. Incrementar a versão
3. Publicar no Internal Testing automaticamente
4. Você só precisa promover para produção quando quiser

---

## Promover para Produção (Futuro)

Quando quiser lançar oficialmente:

1. Play Console > Testing > Internal testing
2. Selecione a versão
3. "Promote release" > "Production"
4. Preencha informações adicionais se solicitado
5. Confirme

---

## Troubleshooting

**Erro: "You uploaded a debuggable APK"**
- Solução: Use profile `production`, não `preview` ou `development`

**Erro: "Version code already used"**
- Solução: Incremente o version code em `app.json`

**Erro: "Package name mismatch"**
- Solução: O package em `app.json` deve ser exatamente `com.zubi.passenger` ou `com.zubi.driver`

**"Upload taking too long"**
- Arquivos .aab podem ser grandes (50-100MB)
- Seja paciente, pode levar 5-10 minutos

---

## Checklist Final

Antes de fazer upload, verifique:

- ✅ App criado na Play Console
- ✅ Package name correto (com.zubi.passenger / com.zubi.driver)
- ✅ App content preenchido (privacy policy, ads, ratings, etc)
- ✅ Store listing preenchido (descrição, ícone, screenshots)
- ✅ AAB gerado com profile `production`
- ✅ AAB baixado e pronto para upload

Tudo OK? Vá em frente! 🚀
