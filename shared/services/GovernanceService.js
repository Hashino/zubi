import StorageService from './StorageService';
import KeyManagementService from './KeyManagementService';

/**
 * GovernanceService - Sistema de Governança do PMCD
 * 
 * Implementa:
 * - XP de Governança (Soulbound)
 * - Trabalho de Oráculo (validação de documentos, mediação)
 * - Escalonamento de Taxas (15% iniciante → 5% veterano)
 * - Votação Quadrática
 * - Tribunal Descentralizado
 */

export const DriverLevel = {
  INICIANTE: 'iniciante',
  INTERMEDIARIO: 'intermediario',
  VETERANO: 'veterano',
  MESTRE: 'mestre',
};

export const FeeRate = {
  [DriverLevel.INICIANTE]: 0.15,      // 15%
  [DriverLevel.INTERMEDIARIO]: 0.10,   // 10%
  [DriverLevel.VETERANO]: 0.07,        // 7%
  [DriverLevel.MESTRE]: 0.05,          // 5%
};

export const LevelThresholds = {
  [DriverLevel.INICIANTE]: 0,          // 0 XP
  [DriverLevel.INTERMEDIARIO]: 1000,   // 1000 XP
  [DriverLevel.VETERANO]: 5000,        // 5000 XP
  [DriverLevel.MESTRE]: 15000,         // 15000 XP
};

class GovernanceService {
  constructor() {
    this.pendingValidations = [];
    this.activeDisputes = [];
  }

  /**
   * Calcula XP ganho por uma viagem
   */
  calculateTripXP(trip) {
    const baseXP = 10; // 10 XP por viagem
    const durationBonus = Math.floor(trip.duration / 10); // +1 XP por 10 min
    const distanceBonus = Math.floor(trip.estimatedDistance); // +1 XP por km
    const ratingBonus = trip.passengerRating >= 4.5 ? 5 : 0; // +5 XP se bem avaliado
    
    return baseXP + durationBonus + distanceBonus + ratingBonus;
  }

  /**
   * Atualiza XP e nível do motorista após viagem
   */
  async awardTripXP(driverId, trip) {
    try {
      const profile = await StorageService.getDriverProfile();
      if (!profile || profile.userId !== driverId) {
        throw new Error('Driver profile not found');
      }

      const xpGained = this.calculateTripXP(trip);
      const oldXP = profile.governance.xp || 0;
      const newXP = oldXP + xpGained;
      
      // Calcula horas viajadas (para governança)
      const hoursFlown = (trip.duration || 0) / 60;
      const oldHours = profile.governance.hoursFlown || 0;
      const newHours = oldHours + hoursFlown;
      
      // Atualiza nível se necessário
      const oldLevel = profile.governance.level;
      const newLevel = this.calculateLevel(newXP);
      const leveledUp = newLevel !== oldLevel;
      
      // Atualiza perfil
      profile.governance = {
        ...profile.governance,
        xp: newXP,
        hoursFlown: newHours,
        level: newLevel,
        feeRate: FeeRate[newLevel],
      };

      await StorageService.saveDriverProfile(profile);

      console.log(`[GovernanceService] Driver ${driverId} gained ${xpGained} XP (${oldXP} → ${newXP})`);
      
      return {
        success: true,
        xpGained,
        newXP,
        oldLevel,
        newLevel,
        leveledUp,
        newFeeRate: FeeRate[newLevel],
      };
    } catch (error) {
      console.error('[GovernanceService] Error awarding XP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcula nível baseado em XP
   */
  calculateLevel(xp) {
    if (xp >= LevelThresholds[DriverLevel.MESTRE]) return DriverLevel.MESTRE;
    if (xp >= LevelThresholds[DriverLevel.VETERANO]) return DriverLevel.VETERANO;
    if (xp >= LevelThresholds[DriverLevel.INTERMEDIARIO]) return DriverLevel.INTERMEDIARIO;
    return DriverLevel.INICIANTE;
  }

  /**
   * Obtém taxa de comissão para um motorista
   */
  async getDriverFeeRate(driverId) {
    try {
      const profile = await StorageService.getDriverProfile();
      if (!profile || profile.userId !== driverId) {
        return FeeRate[DriverLevel.INICIANTE]; // Taxa padrão
      }

      return profile.governance?.feeRate || FeeRate[DriverLevel.INICIANTE];
    } catch (error) {
      console.error('[GovernanceService] Error getting fee rate:', error);
      return FeeRate[DriverLevel.INICIANTE];
    }
  }

  /**
   * Calcula earnings líquidos após taxas
   */
  calculateNetEarnings(grossFare, driverLevel) {
    const feeRate = FeeRate[driverLevel] || FeeRate[DriverLevel.INICIANTE];
    const fee = grossFare * feeRate;
    const netEarnings = grossFare - fee;
    
    return {
      grossFare,
      fee,
      feeRate,
      netEarnings,
      protocolRevenue: fee, // Taxa vai para o protocolo (governança)
    };
  }

  /**
   * Sistema de Trabalho de Oráculo - Validação de documentos
   */
  async submitDocumentForValidation(driverId, documentType, documentData) {
    const validation = {
      id: `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      driverId,
      documentType, // 'driver_license', 'vehicle_registration', etc
      documentData,
      status: 'pending',
      submittedAt: Date.now(),
      validators: [],
      votes: {
        approve: 0,
        reject: 0,
      },
    };

    this.pendingValidations.push(validation);
    
    // Em produção: publicar no Nostr para oráculos validarem
    console.log('[GovernanceService] Document submitted for validation:', validation.id);
    
    return { success: true, validationId: validation.id };
  }

  /**
   * Oráculo valida documento (ganha XP boost)
   */
  async validateDocument(validatorId, validationId, approved, notes = '') {
    const validation = this.pendingValidations.find(v => v.id === validationId);
    if (!validation) {
      return { success: false, error: 'Validation not found' };
    }

    // Verifica se oráculo tem nível suficiente
    const validatorProfile = await StorageService.getDriverProfile();
    if (!validatorProfile || validatorProfile.governance.level === DriverLevel.INICIANTE) {
      return { success: false, error: 'Insufficient governance level' };
    }

    // Verifica se validador já votou nesta validação (previne duplicatas)
    const alreadyVoted = validation.validators.find(v => v.validatorId === validatorId);
    if (alreadyVoted) {
      return { success: false, error: 'Validator already voted on this document' };
    }

    // Adiciona voto
    validation.validators.push({
      validatorId,
      approved,
      notes,
      timestamp: Date.now(),
    });

    if (approved) {
      validation.votes.approve++;
    } else {
      validation.votes.reject++;
    }

    // Se atingiu quorum (3 votos), decide
    const totalVotes = validation.votes.approve + validation.votes.reject;
    if (totalVotes >= 3) {
      validation.status = validation.votes.approve > validation.votes.reject ? 'approved' : 'rejected';
      validation.completedAt = Date.now();
    }

    // Award XP boost para o oráculo
    const xpBoost = 20; // 20 XP por validação
    const validatorProfileUpdated = await StorageService.getDriverProfile();
    if (validatorProfileUpdated) {
      validatorProfileUpdated.governance.xp += xpBoost;
      validatorProfileUpdated.governance.validationsCompleted = (validatorProfileUpdated.governance.validationsCompleted || 0) + 1;
      await StorageService.saveDriverProfile(validatorProfileUpdated);
    }

    console.log('[GovernanceService] Document validated by', validatorId, 'status:', validation.status);
    
    return { success: true, validation, xpBoost };
  }

  /**
   * Sistema de Votação Quadrática
   * Custo de N votos = N² tokens
   */
  calculateVotingCost(numberOfVotes) {
    return Math.pow(numberOfVotes, 2);
  }

  async castQuadraticVote(voterId, proposalId, numberOfVotes) {
    const cost = this.calculateVotingCost(numberOfVotes);
    
    const profile = await StorageService.getDriverProfile();
    if (!profile || profile.userId !== voterId) {
      return { success: false, error: 'Voter profile not found' };
    }

    const votingPower = profile.governance?.xp || 0;
    if (votingPower < cost) {
      return { success: false, error: 'Insufficient voting power (XP)' };
    }

    // Deduz custo (XP não são gastos, apenas "locked" durante votação)
    console.log(`[GovernanceService] ${voterId} cast ${numberOfVotes} votes (cost: ${cost} XP)`);
    
    return {
      success: true,
      voterId,
      proposalId,
      numberOfVotes,
      cost,
    };
  }

  /**
   * Tribunal Descentralizado - Cria disputa
   */
  async createDispute(rideId, reportedBy, reportedUser, reason, evidence) {
    const dispute = {
      id: `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rideId,
      reportedBy,
      reportedUser,
      reason,
      evidence,
      status: 'pending',
      jury: [],
      votes: {
        guilty: 0,
        notGuilty: 0,
      },
      createdAt: Date.now(),
    };

    this.activeDisputes.push(dispute);
    
    // Seleciona júri aleatório de motoristas de alto nível
    // Em produção: usar VRF (Verifiable Random Function) on-chain
    console.log('[GovernanceService] Dispute created:', dispute.id);
    
    return { success: true, disputeId: dispute.id };
  }

  /**
   * Membro do júri vota em disputa (recebe taxa pela mediação)
   */
  async voteOnDispute(juryMemberId, disputeId, guilty, reasoning) {
    const dispute = this.activeDisputes.find(d => d.id === disputeId);
    if (!dispute) {
      return { success: false, error: 'Dispute not found' };
    }

    // Adiciona voto
    dispute.jury.push({
      juryMemberId,
      guilty,
      reasoning,
      timestamp: Date.now(),
    });

    if (guilty) {
      dispute.votes.guilty++;
    } else {
      dispute.votes.notGuilty++;
    }

    // Quorum: 5 votos
    const totalVotes = dispute.votes.guilty + dispute.votes.notGuilty;
    if (totalVotes >= 5) {
      dispute.status = 'resolved';
      dispute.verdict = dispute.votes.guilty > dispute.votes.notGuilty ? 'guilty' : 'not_guilty';
      dispute.resolvedAt = Date.now();
    }

    // Júri recebe taxa de mediação
    const mediationFee = 10; // R$ 10 por voto em disputa
    console.log('[GovernanceService] Jury member', juryMemberId, 'voted on dispute', disputeId);
    
    return { success: true, dispute, mediationFee };
  }

  /**
   * Obtém estatísticas de governança de um motorista
   */
  async getDriverGovernanceStats(driverId) {
    try {
      const profile = await StorageService.getDriverProfile();
      if (!profile || profile.userId !== driverId) {
        return null;
      }

      const governance = profile.governance || {};
      const nextLevel = this.getNextLevel(governance.level);
      const xpToNextLevel = nextLevel ? LevelThresholds[nextLevel] - governance.xp : 0;

      return {
        level: governance.level || DriverLevel.INICIANTE,
        xp: governance.xp || 0,
        hoursFlown: governance.hoursFlown || 0,
        validationsCompleted: governance.validationsCompleted || 0,
        feeRate: governance.feeRate || FeeRate[DriverLevel.INICIANTE],
        nextLevel,
        xpToNextLevel,
        votingPower: governance.xp || 0,
      };
    } catch (error) {
      console.error('[GovernanceService] Error getting governance stats:', error);
      return null;
    }
  }

  /**
   * Obtém próximo nível
   */
  getNextLevel(currentLevel) {
    const levels = [DriverLevel.INICIANTE, DriverLevel.INTERMEDIARIO, DriverLevel.VETERANO, DriverLevel.MESTRE];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }
}

export default new GovernanceService();
