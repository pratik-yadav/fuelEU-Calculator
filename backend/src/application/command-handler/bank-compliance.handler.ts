import { randomUUID } from 'crypto';
import { BankEntry } from '../../domain/entities/bank-entry.entity';
import type { IRouteRepository } from '../../domain/repositories/route.repository';
import type { IShipComplianceRepository } from '../../domain/repositories/ship-compliance.repository';
import type { IBankEntryRepository } from '../../domain/repositories/bank-entry.repository';
import { ComplianceCalculatorService } from '../../domain/services/compliance-calculator.service';
import { NotFoundError, DomainError } from '../../utils/error.util';
import { BankingMapper, type BankEntryResponseDto } from '../dto/banking.dto';
import type { BankComplianceCommand } from '../commands/bank-compliance.command';

export class BankComplianceHandler {
  constructor(
    private readonly routeRepository: IRouteRepository,
    private readonly complianceRepository: IShipComplianceRepository,
    private readonly bankEntryRepository: IBankEntryRepository,
  ) {}

  async execute(command: BankComplianceCommand): Promise<BankEntryResponseDto> {
    const route = await this.routeRepository.findByRouteId(command.shipId);
    if (!route) throw new NotFoundError('Route (ship)', command.shipId);

    const energy = ComplianceCalculatorService.calculateEnergy(route.fuelConsumption);
    const cb = ComplianceCalculatorService.calculateCB(route.ghgIntensity, energy);

    if (cb <= 0) {
      throw new DomainError(
        `Ship '${command.shipId}' has no surplus to bank (CB = ${cb.toFixed(2)} gCO₂eq).`,
      );
    }
    if (command.amount > cb) {
      throw new DomainError(
        `Cannot bank ${command.amount} gCO₂eq — available CB surplus is ${cb.toFixed(2)} gCO₂eq.`,
      );
    }

    // Also enforce that amount does not exceed CB minus already-banked
    const netBanked = await this.bankEntryRepository.sumByShipAndYear(
      command.shipId,
      command.year,
    );
    const availableToBankNow = cb - netBanked;
    if (command.amount > availableToBankNow) {
      throw new DomainError(
        `Cannot bank ${command.amount} — net remaining bankable is ${availableToBankNow.toFixed(2)} gCO₂eq.`,
      );
    }

    const entry = new BankEntry({
      id: randomUUID(),
      shipId: command.shipId,
      year: command.year,
      amountGco2eq: command.amount,
      createdAt: new Date(),
    });

    const saved = await this.bankEntryRepository.create(entry);
    return BankingMapper.toDto(saved);
  }
}
