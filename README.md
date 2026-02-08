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

---

## Como Compilar e Instalar no Android

Escolha o seu sistema operacional abaixo para configurar o ambiente.

### Opção A: Windows (via Winget)

Siga os passos abaixo no **PowerShell (Admin)**.

**1. Pré-requisitos**
Instale Rust, Java JDK e Git:
```powershell
winget install Rustlang.Rustup; winget install Microsoft.OpenJDK.17; winget install Git.Git
```
*Importante: Após instalar, feche e abra o terminal novamente.*

**2. Configurar Toolchain Android (Makepad)**
```powershell
cargo install cargo-makepad
cargo makepad android install-toolchain
```

---

### Opção B: Linux (Ubuntu/Debian)

Siga os passos abaixo no terminal.

**1. Pré-requisitos**
Instale as dependências de sistema e o Java JDK:
```bash
sudo apt-get update
sudo apt-get install git openjdk-17-jdk build-essential pkg-config libssl-dev libasound2-dev
```

Instale o Rust (caso não tenha):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**2. Configurar Toolchain Android (Makepad)**
```bash
cargo install cargo-makepad
cargo makepad android install-toolchain
```

---

### 3. Rodar no Celular (Gerar APK)
Conecte seu celular Android via USB com a **Depuração USB ativada**.

**App do Motorista:**
```bash
cd zubi_driver
cargo makepad android run --release
```

**App do Passageiro:**
```bash
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
