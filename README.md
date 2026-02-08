# Zubi - Decentralized Cooperative Mobility (MVP)

Este é o MVP do protocolo **PMCD** (Protocolo de Mobilidade Cooperativa Descentralizada) implementado em **Rust** usando **Makepad** para a interface gráfica mobile.

## Estrutura do Projeto

O workspace contém 3 crates:

1.  **`zubi_core`**: A "alma" do protocolo. Contém:
    *   Lógica de "Serverless & Ownerless".
    *   Estruturas de Dados: `Ride`, `DriverProfile`, `Location`.
    *   **Prova de Presença**: Lógica de `add_presence_token` para validação Bluetooth.
    *   **Governança**: Sistema de XP, Níveis (Iniciante/Veterano) e cálculo de taxas (15% vs 5%).

2.  **`zubi_driver`**: O App do Motorista.
    *   **UI Minimalista:** Painel de Governança e Status Online/Offline.
    *   **Oráculo:** Simulação de validação de docs para ganhar XP.

3.  **`zubi_passenger`**: O App do Passageiro.
    *   **UI Minimalista:** Solicitação de corrida e pagamento.

## Como Compilar e Instalar no Android (Windows)

Para gerar os APKs e instalar no seu celular, siga os passos abaixo no **PowerShell (Admin)**.

### 1. Pré-requisitos (Via Winget)
Instale Rust, Java JDK e Git:
```powershell
winget install Rustlang.Rustup; winget install Microsoft.OpenJDK.17; winget install Git.Git
```
*Importante: Após instalar, feche e abra o terminal novamente.*

### 2. Configurar Toolchain Android (Makepad)
Isso baixa o SDK/NDK do Android automaticamente para uma pasta local (sem precisar instalar Android Studio):
```powershell
cargo install cargo-makepad
cargo makepad android install-toolchain
```

### 3. Rodar no Celular (Gerar APK)
Conecte seu celular Android via USB com a **Depuração USB ativada**.

**App do Motorista:**
```powershell
cd zubi_driver
cargo makepad android run --release
```

**App do Passageiro:**
```powershell
cd ../zubi_passenger
cargo makepad android run --release
```

## Como Executar no PC (Desktop Mode)
Se quiser testar a UI no computador antes de passar para o celular:

```bash
cd zubi_driver
cargo run
```

## Implementação dos Requisitos do PDF

- [x] **Serverless:** Nenhuma dependência de API centralizada no código.
- [x] **Matchmaking:** Lógica de filtragem geoespacial preparada no Core.
- [x] **Prova de Presença:** Vetor `proof_of_presence_log` na struct `Ride` para armazenar tokens Bluetooth.
- [x] **Gamificação:** Struct `DriverProfile` com XP, verificação de identidade e níveis de taxa dinâmica.
