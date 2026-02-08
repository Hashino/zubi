# Zubi - Build Status

## APKs Disponíveis

### ✅ Passenger App (Zubi Passageiro)
- **Status**: Build concluído com sucesso
- **Download**: https://expo.dev/artifacts/eas/n19KKLfRsj4U3GxUAcnQwj.apk
- **Build ID**: aa154e93-d7b8-41a4-b247-0d4b50c78056
- **Versão**: 1.0.0
- **Data**: 08/02/2026

### ❌ Driver App (Zubi Motorista)  
- **Status**: Aguardando criação do projeto EAS
- **Problema**: EAS CLI requer interação manual para criar projeto
- **Solução**: Criar projeto manualmente

## Como Criar o Projeto EAS para Driver App

### Opção 1: Via Web
1. Acesse https://expo.dev/accounts/hashino/projects
2. Clique em "Create Project"
3. Nome: `zubi-driver`
4. Copie o Project ID gerado
5. Adicione ao `driver-app/app.json`:
```json
"extra": {
  "eas": {
    "projectId": "SEU_PROJECT_ID_AQUI"
  }
}
```
6. Execute: `eas build --platform android --profile preview`

### Opção 2: Via CLI Interativo
1. Execute: `eas init` (no diretório driver-app)
2. Responda "y" quando perguntado
3. Execute: `eas build --platform android --profile preview`

## Instalação do APK no Android

1. Baixe o APK do Passenger App pelo link acima
2. No celular Android, vá em Configurações > Segurança
3. Ative "Fontes Desconhecidas" ou "Instalar apps desconhecidos"
4. Abra o arquivo APK baixado
5. Toque em "Instalar"

## Próximos Passos

### Imediato
- [ ] Criar projeto EAS para Driver App
- [ ] Gerar APK do Driver App
- [ ] Testar ambos os apps em dispositivos reais

### Features Para Produção
Ver arquivo [TODO.md](./TODO.md)
