use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// =========================================================================
// 1. FUNDAMENTOS DA ARQUITETURA (PMCD - Protocolo)
// =========================================================================

/// Representa a identidade soberana (DID) de um usuário na rede.
/// No PMCD, isso seria uma chave pública criptográfica.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Did(pub String);

/// Localização geográfica básica para matchmaking.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Location {
    pub lat: f64,
    pub lng: f64,
}

// =========================================================================
// 2. CICLO DE VIDA DA VIAGEM E PROVA DE PRESENÇA
// =========================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RideState {
    Searching,          // Passageiro procurando (Matchmaking via Nostr)
    Offered,            // Motorista ofereceu, aguardando aceite
    Accepted,           // Passageiro aceitou, motorista a caminho
    InProgress,         // Viagem ativa (troca de tokens Bluetooth/QR)
    Completed,          // Chegou ao destino, aguardando assinatura final
    Settled,            // Pago via Smart Contract
    Disputed,           // Tribunal Descentralizado acionado
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ride {
    pub id: Uuid,
    pub passenger_did: Did,
    pub driver_did: Option<Did>,
    pub state: RideState,
    pub origin: Location,
    pub destination: Location,
    pub start_time: Option<DateTime<Utc>>,
    pub proof_of_presence_log: Vec<String>, // Log de tokens trocados
}

impl Ride {
    pub fn new(passenger: Did, origin: Location, dest: Location) -> Self {
        Self {
            id: Uuid::new_v4(),
            passenger_did: passenger,
            driver_did: None,
            state: RideState::Searching,
            origin,
            destination: dest,
            start_time: None,
            proof_of_presence_log: Vec::new(),
        }
    }

    /// Simula a validação dinâmica via Bluetooth/QR Code.
    /// O motorista e passageiro assinam um timestamp e trocam hashes.
    pub fn add_presence_token(&mut self, token: String) {
        // Na prática, verificaria a assinatura criptográfica do outro peer
        self.proof_of_presence_log.push(token);
    }
}

// =========================================================================
// 3. GAMIFICAÇÃO E GOVERNANÇA (SOULBOUND XP)
// =========================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DriverTier {
    Initiate, // Taxa 15%
    Veteran,  // Taxa 5%, Peso de voto maior
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriverProfile {
    pub did: Did,
    pub xp: u64,
    pub verified_by: Vec<String>, // Assinaturas de Sindicatos/Empresas (Verifiable Credentials)
    pub total_rides: u32,
    pub governance_score: u32, // Ganho via "Trabalho de Oráculo"
}

impl Default for DriverProfile {
    fn default() -> Self {
        Self {
            did: Did("".to_string()),
            xp: 0,
            verified_by: Vec::new(),
            total_rides: 0,
            governance_score: 0,
        }
    }
}

impl DriverProfile {
    pub fn new(did: Did) -> Self {
        Self {
            did,
            xp: 0,
            verified_by: Vec::new(),
            total_rides: 0,
            governance_score: 0,
        }
    }

    pub fn get_tier(&self) -> DriverTier {
        // Lógica simples de progressão baseada no PMCD
        if self.xp > 1000 && self.total_rides > 50 {
            DriverTier::Veteran
        } else {
            DriverTier::Initiate
        }
    }

    pub fn get_fee_percentage(&self) -> f32 {
        match self.get_tier() {
            DriverTier::Initiate => 15.0,
            DriverTier::Veteran => 5.0,
        }
    }

    /// Simula o ganho de XP após validação de documentos (Trabalho de Oráculo)
    pub fn perform_oracle_work(&mut self) {
        self.governance_score += 10;
        self.xp += 5;
    }
}

// =========================================================================
// MOCKS DE REDE (P2P & CONTRACTS)
// =========================================================================

/// Trait que abstrai a camada Libp2p/Nostr
pub trait MobilityNetwork {
    fn broadcast_location(&self, loc: Location);
    fn find_nearby_drivers(&self, loc: Location, radius_km: f64) -> Vec<DriverProfile>;
    fn propose_ride(&self, ride: &Ride);
}

/// Trait que abstrai a camada Polygon/Arbitrum
pub trait ConsensusLayer {
    fn lock_funds(&self, ride_id: Uuid, amount: f64) -> Result<String, String>; // Retorna Hash da Tx
    fn settle_ride(&self, ride_id: Uuid, signatures: (String, String)) -> Result<String, String>;
}
