import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGhg(value: number): string {
  return `${value.toFixed(5)} gCO₂eq/MJ`;
}

export function formatCB(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(3)}B gCO₂eq`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M gCO₂eq`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K gCO₂eq`;
  return `${sign}${abs.toFixed(0)} gCO₂eq`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(5)}%`;
}

export function formatEnergy(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M MJ`;
  return `${value.toLocaleString()} MJ`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
