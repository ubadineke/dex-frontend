"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { AccountPanel } from "./account-panel";
import { PositionsTable } from "./positions-table";
import { OrdersTable } from "./orders-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Percent,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { WalletButton } from "@/components/solana/solana-provider";
import { useUserPositions, useUserCollateral, useDexProgram } from "./dex-data-access";
import { formatSol, formatPnl } from "@/lib/format";
import { BN } from "@coral-xyz/anchor";

export function AccountFeature() {
  const wallet = useWallet();
  const { positions } = useUserPositions();
  const { collateral } = useUserCollateral();
  const { settleFunding } = useDexProgram();

  // Calculate portfolio stats
  const totalPnl = positions.reduce((acc, p) => {
    return acc.add(p.unrealizedPnl);
  }, new BN(0));

  const pnlFormatted = formatPnl(totalPnl);
  const totalPositions = positions.length;
  const longPositions = positions.filter(
    (p) => p.direction === "long"
  ).length;
  const shortPositions = positions.filter(
    (p) => p.direction === "short"
  ).length;
  
  // Day 3: Count settled markets with positions
  const settledPositions = positions.filter(p => p.isMarketSettled).length;
  
  // Day 3: Calculate positions that may have pending funding
  const positionsWithFunding = positions.filter(p => !p.isMarketSettled).length;

  if (!wallet.connected) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="trading-panel">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your account, positions, and orders.
            </p>
            <WalletButton />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Overview</h1>
          <p className="text-muted-foreground text-sm">
            Manage your collateral, positions, and orders
          </p>
        </div>
      </div>

      {/* Day 3: Settlement Banner */}
      {settledPositions > 0 && (
        <Card className="bg-long/10 border-long/30">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-long" />
              <div>
                <p className="font-medium text-long">Positions Ready to Settle</p>
                <p className="text-sm text-muted-foreground">
                  {settledPositions} position{settledPositions > 1 ? 's' : ''} in settled markets - claim your P&L
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-long/50 text-long hover:bg-long/10"
              onClick={() => {
                // Scroll to positions tab
                const positionsTab = document.querySelector('[value="positions"]');
                positionsTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              }}
            >
              View Positions
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Equity */}
        <Card className="trading-panel">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Collateral</p>
              <p className="text-xl font-bold font-mono-numbers">
                {collateral ? formatSol(collateral.total) : "0.0000"} SOL
              </p>
            </div>
          </div>
        </Card>

        {/* Unrealized PnL */}
        <Card className="trading-panel">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                pnlFormatted.isPositive
                  ? "bg-long/10"
                  : pnlFormatted.isNegative
                    ? "bg-short/10"
                    : "bg-muted"
              }`}
            >
              {pnlFormatted.isPositive ? (
                <TrendingUp className="h-5 w-5 text-long" />
              ) : pnlFormatted.isNegative ? (
                <TrendingDown className="h-5 w-5 text-short" />
              ) : (
                <Activity className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unrealized PnL</p>
              <p
                className={`text-xl font-bold font-mono-numbers ${
                  pnlFormatted.isPositive
                    ? "text-long"
                    : pnlFormatted.isNegative
                      ? "text-short"
                      : ""
                }`}
              >
                {pnlFormatted.value}
              </p>
            </div>
          </div>
        </Card>

        {/* Open Positions */}
        <Card className="trading-panel">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <PieChart className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Positions</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold font-mono-numbers">
                  {totalPositions}
                </p>
                <span className="text-xs text-muted-foreground">
                  ({longPositions}L / {shortPositions}S)
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Free Collateral */}
        <Card className="trading-panel">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Free Collateral</p>
              <p className="text-xl font-bold font-mono-numbers">
                {collateral ? formatSol(collateral.free) : "0.0000"} SOL
              </p>
            </div>
          </div>
        </Card>

        {/* Day 3: Funding Status */}
        <Card className="trading-panel">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Funding</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold font-mono-numbers">
                  {positionsWithFunding}
                </p>
                <span className="text-xs text-muted-foreground">
                  active
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Account Panel */}
        <div className="lg:col-span-1">
          <AccountPanel />
        </div>

        {/* Right - Positions & Orders */}
        <div className="lg:col-span-2">
          <Card className="trading-panel">
            <Tabs defaultValue="positions">
              <TabsList className="mb-4">
                <TabsTrigger
                  value="positions"
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Positions
                  {totalPositions > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                      {totalPositions}
                    </span>
                  )}
                  {settledPositions > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-long/20 text-long">
                      {settledPositions} to settle
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Open Orders
                </TabsTrigger>
                <TabsTrigger value="funding" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Funding
                </TabsTrigger>
              </TabsList>

              <TabsContent value="positions">
                <PositionsTable />
              </TabsContent>

              <TabsContent value="orders">
                <OrdersTable />
              </TabsContent>

              <TabsContent value="funding">
                <FundingSection positions={positions} settleFunding={settleFunding} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Day 3: Funding Section Component
function FundingSection({ positions, settleFunding }: { 
  positions: ReturnType<typeof useUserPositions>['positions'];
  settleFunding: ReturnType<typeof useDexProgram>['settleFunding'];
}) {
  const activePositions = positions.filter(p => !p.isMarketSettled);
  
  if (activePositions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No active positions with funding</p>
        <p className="text-xs mt-1">Open a position to start accruing funding</p>
      </div>
    );
  }
  
  const handleSettleFunding = async (marketIndex: number) => {
    await settleFunding.mutateAsync(marketIndex);
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          About Funding
        </h4>
        <p className="text-sm text-muted-foreground">
          Funding payments occur every hour to keep perpetual prices aligned with oracle prices.
          Long positions pay shorts when mark &gt; oracle, and vice versa.
        </p>
      </div>
      
      <div className="space-y-3">
        {activePositions.map((position) => (
          <div 
            key={position.marketIndex}
            className="bg-muted/30 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{position.marketName}</div>
              <div className="text-sm text-muted-foreground">
                {position.direction === 'long' ? (
                  <span className="text-long">Long</span>
                ) : (
                  <span className="text-short">Short</span>
                )}
                {' · '}
                <span className="font-mono-numbers">{position.size.toString()}</span> contracts
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSettleFunding(position.marketIndex)}
              disabled={settleFunding.isPending}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${settleFunding.isPending ? 'animate-spin' : ''}`} />
              Settle Funding
            </Button>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Funding is automatically settled when you close a position.
        Manual settlement updates your collateral balance immediately.
      </p>
    </div>
  );
}

