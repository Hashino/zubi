use zubi_core::{Ride, Location, Did, RideState};
use std::thread;
use std::time::Duration;

// =========================================================================
// ZUBI PASSENGER APP (MOCK UI LOOP)
// =========================================================================

struct PassengerAppState {
    my_did: Did,
    current_ride: Option<Ride>,
}

impl PassengerAppState {
    fn new(did: String) -> Self {
        Self {
            my_did: Did(did),
            current_ride: None,
        }
    }

    fn request_ride(&mut self, origin: Location, dest: Location) {
        println!("Criando solicitação de corrida...");
        let ride = Ride::new(self.my_did.clone(), origin, dest);
        self.current_ride = Some(ride);
        println!("Publicando no Nostr: Procura-se motorista próximo a {:?}...", origin);
    }

    fn simulate_network_update(&mut self) {
        // Simula a resposta da rede (encontrar um motorista)
        if let Some(ride) = &mut self.current_ride {
            if ride.state == RideState::Searching {
                println!("[NOSTR] Motorista encontrado! DID: did:zubi:driver:12345");
                ride.driver_did = Some(Did("did:zubi:driver:12345".to_string()));
                ride.state = RideState::Accepted;
            }
        }
    }
}

fn main() {
    println!("=== ZUBI PASSENGER APP (MVP) ===");
    
    let mut app = PassengerAppState::new("did:zubi:passenger:999".to_string());
    
    let origin = Location { lat: -23.55, lng: -46.63 };
    let dest = Location { lat: -23.58, lng: -46.65 };

    // 1. Solicitar Corrida
    app.request_ride(origin, dest);

    // Loop de simulação
    let mut ticks = 0;
    loop {
        thread::sleep(Duration::from_secs(1));
        ticks += 1;
        
        // Simula atualização de rede
        if ticks == 2 {
            app.simulate_network_update();
        }

        if let Some(ride) = &mut app.current_ride {
            match ride.state {
                RideState::Accepted => {
                    println!("Motorista a caminho...");
                    // Avança estado artificialmente para demonstração
                    ride.state = RideState::InProgress; 
                },
                RideState::InProgress => {
                    println!("Em viagem... (Validando presença via Bluetooth)");
                    // Simula chegada
                    if ticks > 5 {
                        ride.state = RideState::Completed;
                    }
                },
                RideState::Completed => {
                    println!("Chegada ao destino!");
                    println!("Assinando transação com chave privada...");
                    ride.state = RideState::Settled;
                    println!("Pagamento enviado. Avalie seu motorista.");
                    break;
                },
                _ => {}
            }
        }
    }
}
