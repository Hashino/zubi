use zubi_core::{DriverProfile, Ride, RideState, Location, Did, DriverTier};
use std::thread;
use std::time::Duration;

// =========================================================================
// ZUBI DRIVER APP (MOCK UI LOOP)
// =========================================================================

/// Simula o estado da interface do Motorista
struct DriverAppState {
    profile: DriverProfile,
    current_ride: Option<Ride>,
    is_online: bool,
    status_message: String,
}

impl DriverAppState {
    fn new(did: String) -> Self {
        Self {
            profile: DriverProfile::new(Did(did)),
            current_ride: None,
            is_online: false,
            status_message: "Offline".to_string(),
        }
    }

    fn toggle_online(&mut self) {
        self.is_online = !self.is_online;
        if self.is_online {
            self.status_message = "Online - Publicando localização no Nostr...".to_string();
        } else {
            self.status_message = "Offline".to_string();
        }
    }

    /// Simula o recebimento de uma proposta de corrida vinda da rede P2P
    fn receive_ride_request(&mut self, ride: Ride) {
        if self.is_online && self.current_ride.is_none() {
            println!("\n[ALERTA] Nova corrida detectada!");
            println!("Origem: {:?} -> Destino: {:?}", ride.origin, ride.destination);
            // Auto-aceite para fins de MVP
            self.current_ride = Some(ride);
            self.status_message = "Corrida aceita! Indo buscar passageiro...".to_string();
        }
    }

    /// Simula a validação de presença (Proof of Presence) via Bluetooth
    fn simulate_bluetooth_handshake(&mut self) {
        if let Some(ride) = &mut self.current_ride {
            if ride.state == RideState::InProgress {
                let token = format!("PRESENCE_TOKEN_{}", chrono::Utc::now().timestamp());
                ride.add_presence_token(token.clone());
                println!("[BLUETOOTH] Token trocado com passageiro: {}", token);
            }
        }
    }
}

fn main() {
    println!("=== ZUBI DRIVER APP (MVP) ===");
    println!("Iniciando sistema...");

    let my_did = "did:zubi:driver:12345".to_string();
    let mut app = DriverAppState::new(my_did);

    // 1. Login / Identidade
    println!("Identidade carregada: {:?}", app.profile.did);
    println!("Nível: {:?} | Taxa do Protocolo: {}%", app.profile.get_tier(), app.profile.get_fee_percentage());

    // 2. Ficar Online
    app.toggle_online();
    println!("Status: {}", app.status_message);

    // 3. Simulação de Trabalho de Oráculo (Enquanto espera)
    println!("\n[ORACLE] Validando documento pendente na rede...");
    thread::sleep(Duration::from_secs(1));
    app.profile.perform_oracle_work();
    println!("Documento validado! Novo XP: {}", app.profile.xp);

    // 4. Receber Corrida (Simulado)
    let mock_ride = Ride::new(
        Did("did:zubi:passenger:999".to_string()),
        Location { lat: -23.55, lng: -46.63 },
        Location { lat: -23.58, lng: -46.65 },
    );
    
    // Loop de evento simulado
    let mut ticks = 0;
    loop {
        thread::sleep(Duration::from_secs(1));
        ticks += 1;

        if ticks == 2 {
            app.receive_ride_request(mock_ride.clone());
        }

        if let Some(ride) = &mut app.current_ride {
            match ride.state {
                RideState::Searching => ride.state = RideState::Accepted,
                RideState::Accepted => {
                    println!("Status: Cheguei ao passageiro. Iniciando viagem...");
                    ride.state = RideState::InProgress;
                },
                RideState::InProgress => {
                    app.simulate_bluetooth_handshake();
                    if ride.proof_of_presence_log.len() >= 3 {
                        println!("Status: Destino. Finalizando...");
                        ride.state = RideState::Completed;
                    }
                },
                RideState::Completed => {
                    println!("Status: Viagem encerrada. Aguardando assinatura do Smart Contract...");
                    ride.state = RideState::Settled;
                    println!("[CONTRACT] Pagamento liberado na rede Polygon.");
                    break; 
                },
                _ => {}
            }
        }
    }
    
    println!("=== FIM DA SIMULAÇÃO ===");
}
