import { randomUUID } from 'crypto';
import { BankEntry } from '../../domain/entities/bank-entry.entity';
import type { IRouteRepository } from '../../domain/repositories/route.repository';
import type { IBankEntryRepository } from '../../domain/repositories/bank-entry.repository';
import { ComplianceCalculatorService } from '../../domain/services/compliance-calculator.service';
import { NotFoundError, DomainError } from '../../utils/error.util';
import { BankingMapper, type BankEntryResponseDto } from '../dto/banking.dto';
import type { ApplyBankCommand } from '../commands/apply-bank.command';

export class ApplyBankHandler {
  constructor(
    private readonly routeRepository: IRouteRepository,
    private readonly bankEntryRepository: IBankEntryRepository,
  ) {}

  async execute(command: ApplyBankCommand): Promise<BankEntryResponseDto> {
    const route = await this.routeRepository.findByRouteId(command.shipId);
    if (!route) throw new NotFoundError('Route (ship)', command.shipId);

    const energy = ComplianceCalculatorService.calculateEnergy(route.fuelConsumption);
    const cb = ComplianceCalculatorService.calculateCB(route.ghgIntensity, energy);

    if (cb >= 0) {
      throw new DomainError(
        `Ship '${command.shipId}' has no deficit to offset (CB = ${cb.toFixed(2)} gCO₂eq).`,
      );
    }

    const netBanked = await this.bankEntryRepository.sumByShipAndYear(
      command.shipId,
      command.year,
    );
    if (netBanked <= 0) {
      throw new DomainError(
        `Ship '${command.shipId}' has no banked surplus to apply (net balance = ${netBanked.toFixed(2)} gCO₂eq).`,
      );
    }
    if (command.amount > netBanked) {
      throw new DomainError(
        `Cannot apply ${command.amount} — net banked balance is ${netBanked.toFixed(2)} gCO₂eq.`,
      );
    }

    // A negative entry represents drawing from the bank
    const entry = new BankEntry({
      id: randomUUID(),
      shipId: command.shipId,
      year: command.year,
      amountGco2eq: -command.amount,
      createdAt: new Date(),
    });

    const saved = await this.bankEntryRepository.create(entry);
    return BankingMapper.toDto(saved);
  }
}
