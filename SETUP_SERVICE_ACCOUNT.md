# Script para configurar Google Service Account

## Passo 2.1: Criar Service Account na Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Se for seu primeiro projeto, clique em "Select a project" > "New Project"
   - Nome: "Zubi Play Store Publisher"
   - Clique em "Create"
3. Aguarde o projeto ser criado (pode levar alguns segundos)
4. Certifique-se que o projeto está selecionado no topo da página

5. No menu lateral esquerdo:
   - Clique em "☰" (menu hamburger)
   - Vá em **"IAM & Admin"** > **"Service Accounts"**

6. Clique em **"+ CREATE SERVICE ACCOUNT"** (topo da página)

7. Preencha:
   - Service account name: `eas-play-store-publisher`
   - Service account ID: (será preenchido automaticamente)
   - Description: `Conta para publicar apps Zubi na Play Store via EAS`
   - Clique em **"CREATE AND CONTINUE"**

8. Na tela "Grant this service account access to project":
   - **NÃO ADICIONE NENHUMA ROLE AQUI**
   - Clique em **"CONTINUE"**

9. Na tela "Grant users access to this service account":
   - **Deixe vazio**
   - Clique em **"DONE"**

10. Agora você verá a service account na lista. Clique nos **3 pontinhos (⋮)** na linha dela
    - Selecione **"Manage keys"**

11. Clique em **"ADD KEY"** > **"Create new key"**
    - Tipo: **JSON**
    - Clique em **"CREATE"**

12. Um arquivo JSON será baixado automaticamente. Este arquivo contém as credenciais.
    - **IMPORTANTE**: Guarde este arquivo em local seguro!
    - Nome do arquivo: algo como `zubi-play-store-publisher-xxxxx.json`

13. Copie o **email da service account** (formato: `eas-play-store-publisher@project-name.iam.gserviceaccount.com`)
    - Você vai usar este email no próximo passo

---

## Passo 2.2: Vincular Service Account à Play Console

Agora vamos dar permissão para esta service account publicar apps.

1. Volte para: https://play.google.com/console/
2. Selecione **"All apps"** (ou qualquer app)
3. No menu lateral esquerdo, vá até o final e clique em **"Users and permissions"**

4. Clique em **"Invite new users"** (botão no topo)

5. Cole o email da service account que você copiou
   - Exemplo: `eas-play-store-publisher@zubi-play-store-123456.iam.gserviceaccount.com`

6. Em **"App permissions"**:
   - Clique em **"Add app"**
   - Selecione **ambos os apps** (Zubi Passageiro E Zubi Motorista)
   - Para cada app, marque:
     - ✅ **View app information and download bulk reports**
     - ✅ **Manage production releases** 
     - ✅ **Manage testing track releases** (CRÍTICO!)
     - ✅ **Release apps to testing tracks**
   
7. Em **"Account permissions"**:
   - **NÃO marque nada** (por segurança, não dê permissões administrativas)

8. Clique em **"Invite user"**

9. **IMPORTANTE**: A service account NÃO vai receber email de confirmação. O acesso é imediato!

✅ Service Account configurada com sucesso!

---

## Passo 2.3: Adicionar Credenciais ao GitHub

Agora vamos adicionar as credenciais como secrets no GitHub.

1. Abra o arquivo JSON baixado no passo 2.1 com um editor de texto
2. Copie **TODO o conteúdo** do arquivo (Ctrl+A, Ctrl+C)

3. Acesse: https://github.com/Hashino/zubi/settings/secrets/actions

4. Clique em **"New repository secret"**

5. Adicione o primeiro secret:
   - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Secret: Cole o conteúdo completo do arquivo JSON
   - Clique em **"Add secret"**

✅ Credenciais adicionadas ao GitHub!

---

## Verificação Rápida

Antes de continuar, verifique:
- ✅ Service account criada na Google Cloud
- ✅ Arquivo JSON baixado e guardado
- ✅ Service account adicionada na Play Console com permissões corretas
- ✅ JSON adicionado aos GitHub Secrets

Se tudo estiver OK, siga para o Passo 3!
