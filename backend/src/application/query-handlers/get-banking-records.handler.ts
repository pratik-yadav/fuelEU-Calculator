import type { IBankEntryRepository } from '../../domain/repositories/bank-entry.repository';
import { BankingMapper, type BankEntryResponseDto } from '../dto/banking.dto';
import type { GetBankingRecordsQuery } from '../queries/get-banking-records.query';

export class GetBankingRecordsHandler {
  constructor(private readonly bankEntryRepository: IBankEntryRepository) {}

  async execute(query: GetBankingRecordsQuery): Promise<BankEntryResponseDto[]> {
    const entries = await this.bankEntryRepository.findByShipAndYear(
      query.shipId,
      query.year,
    );
    return BankingMapper.toDtoList(entries);
  }
}
