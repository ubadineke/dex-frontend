/**
 * DEX Constants
 */

import { PublicKey } from "@solana/web3.js";

// Program ID (matches deployed program)
export const PROGRAM_ID = new PublicKey(
  "8NgM6fAspbaUv1W2pAkowdo8R9p9eYkoXPUq3DbH5Yf9"
);

// PDA Seeds
export const STATE_SEED = Buffer.from("state");
export const COLLATERAL_VAULT_SEED = Buffer.from("collateral_vault");
export const USER_SEED = Buffer.from("user");
export const MARKET_SEED = Buffer.from("market");

// Precision constants
export const PRICE_PRECISION = 1_000_000; // 1e6
export const BASE_PRECISION = 1_000_000_000; // 1e9
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const MARGIN_PRECISION = 10_000; // 1e4 for basis points

// Margin defaults
export const DEFAULT_MAINTENANCE_MARGIN_RATIO = 625; // 6.25% in basis points
export const MAX_PREDICTION_PRICE = PRICE_PRECISION; // Max price = 1.0 = 100%

// UI Constants
export const MAX_LEVERAGE = 50;
export const MIN_LEVERAGE = 1;
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%


