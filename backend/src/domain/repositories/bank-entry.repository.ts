import type { BankEntry } from '../entities/bank-entry.entity';

/**
 * IBankEntryRepository — port for the banking ledger (Article 20).
 */
export interface IBankEntryRepository {
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  /** Returns the net sum of all entries (positive − |negative|). */
  sumByShipAndYear(shipId: string, year: number): Promise<number>;
  create(entry: BankEntry): Promise<BankEntry>;
}
