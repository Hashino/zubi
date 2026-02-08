# Configurar EXPO_TOKEN para GitHub Actions

## O que é o EXPO_TOKEN?

É um token de acesso pessoal que permite o GitHub Actions fazer builds via EAS sem precisar de login interativo.

## Como obter o EXPO_TOKEN

### Opção 1: Via Web (Mais Fácil)

1. Acesse: https://expo.dev/accounts/hashino/settings/access-tokens

2. Clique em **"Create Token"**

3. Preencha:
   - Name: `GitHub Actions CI/CD`
   - Scope: Deixe o padrão selecionado

4. Clique em **"Create"**

5. **IMPORTANTE**: Copie o token que aparece
   - Ele começa com algo como: `exxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **COPIE AGORA!** Ele só aparece uma vez

### Opção 2: Via CLI

```bash
npx expo login
# Faça login com suas credenciais

# Gerar token
npx eas whoami
```

O token estará em `~/.expo/eas.json` ou será exibido.

---

## Adicionar ao GitHub Secrets

1. Acesse: https://github.com/Hashino/zubi/settings/secrets/actions

2. Clique em **"New repository secret"**

3. Preencha:
   - Name: `EXPO_TOKEN`
   - Secret: Cole o token copiado
   - Clique em **"Add secret"**

✅ EXPO_TOKEN configurado!

---

## Verificar se está funcionando

Depois de adicionar o secret, você pode testar:

1. Vá em: https://github.com/Hashino/zubi/actions
2. Selecione workflow: "EAS Build & Deploy - Passenger App"
3. Clique em **"Run workflow"**
4. Escolha:
   - Branch: main
   - Profile: preview
   - Submit: false (só build, sem publicar)
5. Clique em **"Run workflow"**

Se o build iniciar sem erros de autenticação, está funcionando! 🎉
