# Zubi - Decentralized Cooperative Mobility (MVP)

Este é o MVP do protocolo **PMCD** (Protocolo de Mobilidade Cooperativa Descentralizada) implementado em **Rust**.

Devido às limitações do ambiente de execução (sem Android Studio/NDK ou GPU), este MVP foca na **implementação fiel da lógica do protocolo**, simulando a interação P2P, a validação de presença e a economia de governança via CLI.

## Estrutura do Projeto

O workspace contém 3 crates:

1.  **`zubi_core`**: A "alma" do protocolo. Contém:
    *   Lógica de "Serverless & Ownerless".
    *   Estruturas de Dados: `Ride`, `DriverProfile`, `Location`.
    *   **Prova de Presença**: Lógica de `add_presence_token` para validação Bluetooth.
    *   **Governança**: Sistema de XP, Níveis (Iniciante/Veterano) e cálculo de taxas (15% vs 5%).

2.  **`zubi_driver`**: O App do Motorista.
    *   Simula o recebimento de corridas via Nostr.
    *   Executa "Trabalho de Oráculo" (validação de docs) enquanto ocioso para ganhar XP.
    *   Simula o handshake Bluetooth com o passageiro.

3.  **`zubi_passenger`**: O App do Passageiro.
    *   Publica intenção de viagem.
    *   Valida a identidade do motorista.
    *   Assina criptograficamente o encerramento da corrida.

## Como Executar

Se você tiver Rust instalado na sua máquina local:

### 1. Rodar o Motorista
```bash
cd zubi_driver
cargo run
```

### 2. Rodar o Passageiro
```bash
cd zubi_passenger
cargo run
```

(Em um cenário real de rede, eles se comunicariam via Libp2p/Nostr. Aqui, eles rodam simulações de estado independentes para demonstrar o fluxo).

## Próximos Passos para Produção (Makepad/Android)

Para transformar isso em um APK Android visual usando Makepad:

1.  Instalar dependências: `cargo install cargo-makepad`
2.  Adicionar `makepad-widgets` ao `Cargo.toml`.
3.  Substituir os `println!` nos arquivos `main.rs` por widgets UI do Makepad (`Frame`, `Label`, `Button`).
4.  Compilar para Android: `cargo makepad android run -p zubi_driver --release`

## Implementação dos Requisitos do PDF

- [x] **Serverless:** Nenhuma dependência de API centralizada no código.
- [x] **Matchmaking:** Lógica de filtragem geoespacial preparada no Core.
- [x] **Prova de Presença:** Vetor `proof_of_presence_log` na struct `Ride` para armazenar tokens Bluetooth.
- [x] **Gamificação:** Struct `DriverProfile` com XP, verificação de identidade e níveis de taxa dinâmica.
