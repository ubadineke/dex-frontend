"use client";

import { MarketSelector } from "./market-selector";
import { MarketInfo } from "./market-info";
import { OrderForm } from "./order-form";
import { MockChart } from "./mock-chart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Bot, Zap, Shield } from "lucide-react";
import { useSelectedMarket, MarketStatus } from "./dex-data-access";

export function TradeFeature() {
  const { selectedMarket } = useSelectedMarket();
  const isSettled = selectedMarket?.info.status === MarketStatus.Settled;
  
  return (
    <div className="max-w-[1800px] mx-auto lg:h-[calc(100vh-140px)]">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:h-full">
        {/* Left Column - Chart (60%) */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="trading-panel flex-1 flex flex-col h-[300px] md:h-[400px] lg:min-h-[500px] lg:h-auto">
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="trading-panel-header mb-0 flex items-center gap-2">
                <Activity className="h-4 w-4 text-long animate-pulse" />
                Price History
              </div>
              <div className="flex items-center gap-4 text-xs">
                {/* Day 3: System Status Indicators */}
                <SystemStatusBadges />
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-long animate-pulse" />
                  Live
                </span>
              </div>
            </div>
            
            {/* Chart */}
            <div className="flex-1">
              <MockChart />
            </div>
          </Card>
        </div>

        {/* Right Column - Trading Panel (40%) */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:overflow-y-auto lg:max-h-[calc(100vh-140px)]">
          {/* Market Selector */}
          <div className="w-full">
            <MarketSelector />
          </div>

          {/* Day 3: Settlement Warning Banner */}
          {isSettled && (
            <div className="bg-short/10 border border-short/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-short" />
                <span className="text-sm font-medium text-short">Trading Disabled</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This market has settled. Go to Account to settle your positions.
              </p>
            </div>
          )}

          {/* Market Info */}
          <MarketInfo />

          {/* Order Form */}
          <OrderForm />
        </div>
      </div>
    </div>
  );
}

// Day 3: System status badges component
function SystemStatusBadges() {
  return (
    <div className="flex items-center gap-2">
      {/* Keeper Status */}
      <div className="relative group">
        <Badge variant="outline" className="h-6 px-2 gap-1 border-long/30 text-long text-xs cursor-help">
          <Bot className="h-3 w-3" />
          Keeper
        </Badge>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <p className="font-medium mb-2">Keeper Service Active</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-long" />
              Oracle prices updating
            </li>
            <li className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-long" />
              Orders being filled
            </li>
            <li className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-long" />
              Liquidations monitored
            </li>
            <li className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-long" />
              Funding rates updating
            </li>
          </ul>
        </div>
      </div>

      {/* Funding Status */}
      <div className="relative group">
        <Badge variant="outline" className="h-6 px-2 gap-1 border-primary/30 text-primary text-xs cursor-help">
          <Zap className="h-3 w-3" />
          1h
        </Badge>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 p-3 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <p className="font-medium mb-1">Funding Period</p>
          <p className="text-xs text-muted-foreground">
            Funding payments settle every hour.
            Longs pay shorts when mark &gt; oracle.
          </p>
        </div>
      </div>
    </div>
  );
}
