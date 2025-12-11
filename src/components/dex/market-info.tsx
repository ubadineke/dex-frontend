"use client";

import { useSelectedMarket, MarketStatus } from "./dex-data-access";
import { formatPriceAsPercent, formatBaseAmount } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Clock, Percent, CheckCircle2 } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

export function MarketInfo() {
  const { selectedMarket, isLoading } = useSelectedMarket();

  if (isLoading) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Market Info</div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!selectedMarket) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Market Info</div>
        <p className="text-muted-foreground text-sm">
          No market selected. Please select a market to trade.
        </p>
      </div>
    );
  }

  const { info } = selectedMarket;
  const midPrice = info.oraclePrice;
  const bidPrice = info.bidPrice;
  const askPrice = info.askPrice;

  return (
    <div className="trading-panel">
      {/* Market Name & Status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">{info.name}</h2>
          <p className="text-xs text-muted-foreground">Prediction Market</p>
        </div>
        <Badge
          variant={info.status === "active" ? "success" : "secondary"}
          className="capitalize"
        >
          {info.status}
        </Badge>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">YES (Bid)</p>
          <p className="font-mono-numbers text-xl font-bold text-long">
            {formatPriceAsPercent(bidPrice)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Oracle</p>
          <p className="font-mono-numbers text-xl font-bold">
            {formatPriceAsPercent(midPrice)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">NO (Ask)</p>
          <p className="font-mono-numbers text-xl font-bold text-short">
            {formatPriceAsPercent(new BN(1_000_000).sub(askPrice))}
          </p>
        </div>
      </div>

      {/* Spread */}
      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Spread</span>
          <span className="font-mono-numbers text-sm">
            {formatSpread(bidPrice, askPrice)}
          </span>
        </div>
      </div>

      {/* Settlement Banner (Day 3) */}
      {info.status === MarketStatus.Settled && (
        <div className="bg-long/10 border border-long/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-long" />
            <span className="text-sm font-medium text-long">Market Settled</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Settlement Price:</span>
            <span className="font-mono-numbers font-medium">
              {formatPriceAsPercent(info.settlementPrice)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Settle your positions to claim P&L
          </p>
        </div>
      )}

      {/* Funding Rate (Day 3) */}
      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Funding Rate</span>
        </div>
        <div className="flex items-center justify-between">
          <FundingRateDisplay rate={info.lastFundingRate} />
          <FundingCountdown lastTs={info.lastFundingRateTs} period={info.fundingPeriod} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cum. Long:</span>
            <span className="font-mono-numbers">{formatFundingRate(info.cumulativeFundingRateLong)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cum. Short:</span>
            <span className="font-mono-numbers">{formatFundingRate(info.cumulativeFundingRateShort)}</span>
          </div>
        </div>
      </div>

      {/* Open Interest */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Open Interest</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-long-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-long" />
              <span className="text-xs text-muted-foreground">Long</span>
            </div>
            <p className="font-mono-numbers text-sm font-medium text-long">
              {formatBaseAmount(info.openInterestLong)}
            </p>
          </div>

          <div className="bg-short-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3 w-3 text-short" />
              <span className="text-xs text-muted-foreground">Short</span>
            </div>
            <p className="font-mono-numbers text-sm font-medium text-short">
              {formatBaseAmount(info.openInterestShort)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Day 3: Funding rate display component
function FundingRateDisplay({ rate }: { rate: BN }) {
  const rateNum = rate.toNumber() / 1_000_000; // FUNDING_PRECISION
  const isPositive = rateNum > 0;
  const isNegative = rateNum < 0;
  
  return (
    <div className={`font-mono-numbers text-lg font-bold ${
      isPositive ? 'text-long' : isNegative ? 'text-short' : ''
    }`}>
      {isPositive ? '+' : ''}{(rateNum * 100).toFixed(4)}%
    </div>
  );
}

// Day 3: Funding countdown component
function FundingCountdown({ lastTs, period }: { lastTs: BN; period: BN }) {
  const now = Math.floor(Date.now() / 1000);
  const lastTsNum = lastTs.toNumber();
  const periodNum = period.toNumber();
  const nextUpdate = lastTsNum + periodNum;
  const timeRemaining = Math.max(0, nextUpdate - now);
  
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;
  
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span className="font-mono-numbers">
        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

function formatFundingRate(rate: BN): string {
  const rateNum = rate.toNumber() / 1_000_000;
  return `${(rateNum * 100).toFixed(4)}%`;
}

function formatSpread(bid: BN, ask: BN): string {
  const spread = ask.sub(bid);
  const spreadPercent = spread.toNumber() / 10000; // Convert to percentage
  return `${spreadPercent.toFixed(2)}%`;
}

