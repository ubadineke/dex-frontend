/**
 * Formatting utilities for the DEX
 */

import { BN } from "@coral-xyz/anchor";
import { PRICE_PRECISION, BASE_PRECISION, LAMPORTS_PER_SOL } from "./constants";

/**
 * Format a price value (6 decimals) to a dollar string
 * e.g., 500000 -> "$0.50"
 */
export function formatPriceAsPercent(price: BN | number | string): string {
  const priceNum =
    typeof price === "number"
      ? price
      : typeof price === "string"
        ? parseFloat(price)
        : price.toNumber();

  const dollarValue = priceNum / PRICE_PRECISION;
  return `$${dollarValue.toFixed(2)}`;
}

/**
 * Format a price value (6 decimals) to a decimal string
 * e.g., 500000 -> "0.50"
 */
export function formatPrice(price: BN | number | string): string {
  const priceNum =
    typeof price === "number"
      ? price
      : typeof price === "string"
        ? parseFloat(price)
        : price.toNumber();

  const value = priceNum / PRICE_PRECISION;
  return value.toFixed(4);
}

/**
 * Format lamports to SOL with specified decimals
 */
export function formatSol(lamports: BN | number | string, decimals = 4): string {
  const lamportsNum =
    typeof lamports === "number"
      ? lamports
      : typeof lamports === "string"
        ? parseFloat(lamports)
        : lamports.toNumber();

  const sol = lamportsNum / LAMPORTS_PER_SOL;
  return sol.toFixed(decimals);
}

/**
 * Format base asset amount (9 decimals)
 */
export function formatBaseAmount(amount: BN | number | string, decimals = 4): string {
  const amountNum =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
        ? parseFloat(amount)
        : amount.toNumber();

  const value = amountNum / BASE_PRECISION;
  return value.toFixed(decimals);
}

/**
 * Format PnL with color indication
 */
export function formatPnl(pnl: BN | number | string): {
  value: string;
  isPositive: boolean;
  isNegative: boolean;
} {
  const pnlNum =
    typeof pnl === "number"
      ? pnl
      : typeof pnl === "string"
        ? parseFloat(pnl)
        : pnl.toNumber();

  const sol = pnlNum / LAMPORTS_PER_SOL;
  const isPositive = sol > 0;
  const isNegative = sol < 0;

  return {
    value: `${isPositive ? "+" : ""}${sol.toFixed(4)} SOL`,
    isPositive,
    isNegative,
  };
}

/**
 * Format leverage multiplier
 */
export function formatLeverage(leverage: number): string {
  return `${leverage.toFixed(1)}x`;
}

/**
 * Format percentage change
 */
export function formatPercentChange(change: number): {
  value: string;
  isPositive: boolean;
  isNegative: boolean;
} {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return {
    value: `${isPositive ? "+" : ""}${change.toFixed(2)}%`,
    isPositive,
    isNegative,
  };
}

/**
 * Convert bytes array to string (for market names)
 */
export function bytesToString(bytes: number[]): string {
  const nonZeroBytes = bytes.filter((b) => b !== 0);
  return String.fromCharCode(...nonZeroBytes);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Parse SOL input to lamports BN
 */
export function solToLamports(sol: string | number): BN {
  const solNum = typeof sol === "string" ? parseFloat(sol) : sol;
  return new BN(Math.floor(solNum * LAMPORTS_PER_SOL));
}

/**
 * Parse base amount input to BN
 */
export function parseBaseAmount(amount: string | number): BN {
  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
  return new BN(Math.floor(amountNum * BASE_PRECISION));
}


