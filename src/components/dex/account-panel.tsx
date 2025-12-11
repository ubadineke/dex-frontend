"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDexProgram, useUserCollateral, useUserPositions } from "./dex-data-access";
import { formatSol, formatPnl, solToLamports } from "@/lib/format";
import { useGetBalance } from "@/components/account/account-data-access";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function AccountPanel() {
  const wallet = useWallet();
  const { userQuery, initializeUser, deposit, withdraw } = useDexProgram();
  const { collateral, isLoading: collateralLoading, exists } = useUserCollateral();
  const { positions } = useUserPositions();

  const walletBalance = useGetBalance({
    address: wallet.publicKey!,
  });

  // Calculate total unrealized PnL
  const totalPnl = positions.reduce((acc, p) => {
    return acc.add(p.unrealizedPnl);
  }, new BN(0));

  const pnlFormatted = formatPnl(totalPnl);

  if (!wallet.connected) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Account</div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Connect your wallet to start trading
          </p>
        </div>
      </div>
    );
  }

  if (collateralLoading || userQuery.isLoading) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Account</div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // User doesn't exist yet
  if (!exists) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Account</div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            You need to create an account to start trading
          </p>
          <Button
            onClick={() => initializeUser.mutateAsync()}
            disabled={initializeUser.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {initializeUser.isPending ? "Creating..." : "Create Account"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-panel">
      <div className="trading-panel-header">Account</div>

      {/* Collateral & Equity */}
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          {/* Deposited Collateral */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Deposited</span>
            <span className="font-mono-numbers text-sm">
              {collateral ? formatSol(collateral.total) : "0.0000"} SOL
            </span>
          </div>

          {/* Unrealized P&L */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Unrealized P&L</span>
            <span
              className={`font-mono-numbers text-sm font-medium ${
                pnlFormatted.isPositive
                  ? "text-long"
                  : pnlFormatted.isNegative
                    ? "text-short"
                    : ""
              }`}
            >
              {pnlFormatted.value}
            </span>
          </div>

          {/* Equity = Deposited + Unrealized P&L */}
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-sm font-medium">Equity</span>
            <span className="font-mono-numbers text-lg font-bold">
              {collateral?.equity ? formatSol(collateral.equity) : "0.0000"} SOL
            </span>
          </div>

          {/* Free Collateral (withdrawable) */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Free (withdrawable)</span>
            <span className="font-mono-numbers text-long">
              {collateral?.free ? formatSol(collateral.free) : "0.0000"} SOL
            </span>
          </div>

          {/* Margin Used */}
          {collateral?.marginUsed && !collateral.marginUsed.isZero() && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Margin Used</span>
              <span className="font-mono-numbers text-primary">
                {formatSol(collateral.marginUsed)} SOL
              </span>
            </div>
          )}
        </div>

        {/* Wallet Balance */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Wallet Balance</span>
          <span className="font-mono-numbers">
            {walletBalance.data
              ? (walletBalance.data / LAMPORTS_PER_SOL).toFixed(4)
              : "0.0000"}{" "}
            SOL
          </span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <DepositModal
            maxAmount={walletBalance.data || 0}
            onDeposit={(amount) => deposit.mutateAsync(amount)}
            isPending={deposit.isPending}
          />
          <WithdrawModal
            maxAmount={collateral?.free?.toNumber() || 0}
            totalCollateral={collateral?.total?.toNumber() || 0}
            onWithdraw={(amount) => withdraw.mutateAsync(amount)}
            isPending={withdraw.isPending}
          />
        </div>
      </div>
    </div>
  );
}

// ============ DEPOSIT MODAL ============

interface DepositModalProps {
  maxAmount: number;
  onDeposit: (amount: BN) => Promise<unknown>;
  isPending: boolean;
}

function DepositModal({ maxAmount, onDeposit, isPending }: DepositModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    await onDeposit(solToLamports(amount));
    setAmount("");
    setOpen(false);
  };

  const setMax = () => {
    // Leave some SOL for transaction fees
    const maxSol = Math.max(0, maxAmount / LAMPORTS_PER_SOL - 0.01);
    setAmount(maxSol.toFixed(4));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <ArrowDownToLine className="h-4 w-4 mr-2" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit SOL</DialogTitle>
          <DialogDescription>
            Deposit SOL as collateral for trading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className="font-mono-numbers">
              {(maxAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL
            </span>
          </div>

          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16 font-mono-numbers"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
              onClick={setMax}
            >
              MAX
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={isPending || !amount || parseFloat(amount) <= 0}
          >
            {isPending ? "Depositing..." : "Deposit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ WITHDRAW MODAL ============

interface WithdrawModalProps {
  maxAmount: number; // Free collateral (safe to withdraw)
  totalCollateral: number; // Total deposited
  onWithdraw: (amount: BN) => Promise<unknown>;
  isPending: boolean;
}

function WithdrawModal({ maxAmount, totalCollateral, onWithdraw, isPending }: WithdrawModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const amountNum = parseFloat(amount) || 0;
  const amountLamports = amountNum * LAMPORTS_PER_SOL;
  const exceedsFreeCollateral = amountLamports > maxAmount && maxAmount < totalCollateral;

  const handleWithdraw = async () => {
    if (!amount || amountNum <= 0) return;
    await onWithdraw(solToLamports(amount));
    setAmount("");
    setOpen(false);
  };

  const setMax = () => {
    const maxSol = maxAmount / LAMPORTS_PER_SOL;
    setAmount(maxSol.toFixed(4));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <ArrowUpFromLine className="h-4 w-4 mr-2" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw SOL</DialogTitle>
          <DialogDescription>
            Withdraw SOL collateral to your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Free collateral info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Deposited</span>
              <span className="font-mono-numbers">
                {(totalCollateral / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Free to Withdraw</span>
              <span className="font-mono-numbers text-long font-medium">
                {(maxAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </span>
            </div>
            {maxAmount < totalCollateral && (
              <p className="text-xs text-muted-foreground">
                Some collateral is locked as margin for open positions.
              </p>
            )}
          </div>

          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-16 font-mono-numbers"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
              onClick={setMax}
            >
              MAX
            </Button>
          </div>

          {/* Warning if exceeds free collateral */}
          {exceedsFreeCollateral && (
            <div className="flex items-start gap-2 text-short text-sm bg-short/10 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Amount exceeds free collateral. Close some positions to withdraw more.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={isPending || !amount || amountNum <= 0 || amountLamports > totalCollateral}
            variant="destructive"
          >
            {isPending ? "Withdrawing..." : "Withdraw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

