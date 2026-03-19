import { z } from 'zod';
import type { BankEntry } from '../../domain/entities/bank-entry.entity';

export const BankRequestSchema = z.object({
  shipId: z.string().min(1, 'shipId is required.'),
  year: z.number().int().min(2020),
  amount: z.number().positive('Amount must be positive.'),
});

export type BankRequestDto = z.infer<typeof BankRequestSchema>;

export interface BankEntryResponseDto {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  type: 'BANKED' | 'APPLIED';
  createdAt: string;
}

export class BankingMapper {
  static toDto(entry: BankEntry): BankEntryResponseDto {
    return {
      id: entry.id,
      shipId: entry.shipId,
      year: entry.year,
      amountGco2eq: entry.amountGco2eq,
      type: entry.amountGco2eq > 0 ? 'BANKED' : 'APPLIED',
      createdAt: entry.createdAt.toISOString(),
    };
  }

  static toDtoList(entries: BankEntry[]): BankEntryResponseDto[] {
    return entries.map(BankingMapper.toDto);
  }
}
