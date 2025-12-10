"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/tooltip";
import {
  useDexProgram,
  useSelectedMarket,
  useUserCollateral,
  PositionDirection,
  OrderType,
  TriggerCondition,
  MarketStatus,
} from "./dex-data-access";
import { formatPriceAsPercent, formatSol, parseBaseAmount } from "@/lib/format";
import { PRICE_PRECISION, MAX_LEVERAGE } from "@/lib/constants";

// ============ TP/SL ROW COMPONENT ============

interface TpSlRowProps {
  label: string;
  type: "tp" | "sl";
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  triggerPrice: string;
  onTriggerPriceChange: (value: string) => void;
  percentValue: string;
  onPercentValueChange: (value: string) => void;
  useRoi: boolean;
  onUseRoiChange: (useRoi: boolean) => void;
  entryPrice: number;
  leverage: number;
  size: number;
  isLong: boolean;
  className?: string;
}

function TpSlRow({
  label,
  type,
  enabled,
  onEnabledChange,
  triggerPrice,
  onTriggerPriceChange,
  percentValue,
  onPercentValueChange,
  useRoi,
  onUseRoiChange,
  entryPrice,
  leverage,
  size,
  isLong,
  className,
}: TpSlRowProps) {
  const isTp = type === "tp";

  // Calculate estimated P&L
  const estPnl = useMemo(() => {
    if (!triggerPrice || !entryPrice || !size) {
      return { sol: 0, percent: 0 };
    }

    const trigger = parseFloat(triggerPrice);
    const priceDiff = isLong ? trigger - entryPrice : entryPrice - trigger;
    const pnlSol = (priceDiff / entryPrice) * size * leverage;
    const pnlPercent = (priceDiff / entryPrice) * 100 * leverage;

    return { sol: pnlSol, percent: pnlPercent };
  }, [triggerPrice, entryPrice, size, leverage, isLong]);

  // Handle trigger price change -> update percent
  const handleTriggerPriceChange = useCallback(
    (value: string) => {
      onTriggerPriceChange(value);

      if (value && entryPrice > 0) {
        const trigger = parseFloat(value);
        const pricePct = ((trigger - entryPrice) / entryPrice) * 100;

        if (useRoi) {
          const roiPct = pricePct * leverage;
          onPercentValueChange(roiPct.toFixed(2));
        } else {
          onPercentValueChange(pricePct.toFixed(2));
        }
      }
    },
    [entryPrice, leverage, useRoi, onTriggerPriceChange, onPercentValueChange]
  );

  // Handle percent change -> update trigger price
  const handlePercentChange = useCallback(
    (value: string) => {
      onPercentValueChange(value);

      if (value && entryPrice > 0) {
        const pct = parseFloat(value);
        const pricePct = useRoi ? pct / leverage : pct;
        const trigger = entryPrice * (1 + pricePct / 100);
        onTriggerPriceChange(trigger.toFixed(4));
      }
    },
    [entryPrice, leverage, useRoi, onTriggerPriceChange, onPercentValueChange]
  );

  // Toggle between Price% and ROI%
  const handleToggleRoi = useCallback(
    (newUseRoi: boolean) => {
      onUseRoiChange(newUseRoi);

      // Convert the current percent value
      if (percentValue) {
        const pct = parseFloat(percentValue);
        if (newUseRoi) {
          // Converting from Price% to ROI%
          onPercentValueChange((pct * leverage).toFixed(2));
        } else {
          // Converting from ROI% to Price%
          onPercentValueChange((pct / leverage).toFixed(2));
        }
      }
    },
    [percentValue, leverage, onUseRoiChange, onPercentValueChange]
  );

  const isPositivePnl = estPnl.sol >= 0;
  const pnlColor = isPositivePnl ? "text-long" : "text-short";

  return (
    <div className={className}>
      {/* Header Row with Checkbox */}
      <div className="flex items-center gap-3 mb-2">
        <Checkbox checked={enabled} onCheckedChange={onEnabledChange} />
        <Label
          className={`text-sm font-medium cursor-pointer ${
            isTp ? "text-long" : "text-short"
          }`}
          onClick={() => onEnabledChange(!enabled)}
        >
          {label}
        </Label>
      </div>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          enabled ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pl-7 space-y-3">
          {/* Inputs Row - Wider Layout */}
          <div className="grid grid-cols-2 gap-3">
            {/* Trigger Price Input */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Trigger Price
              </Label>
              <Input
                type="number"
                placeholder="0.0000"
                value={triggerPrice}
                onChange={(e) => handleTriggerPriceChange(e.target.value)}
                className="h-9 text-sm font-mono-numbers"
                step="0.0001"
              />
            </div>

            {/* Percent Input with Toggle */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label className="text-xs text-muted-foreground">
                  {useRoi ? "ROI %" : "Price %"}
                </Label>
                <InfoTooltip
                  content={
                    <div className="space-y-2 max-w-[220px]">
                      <div>
                        <span className="font-semibold text-foreground">Price%:</span>
                        <span className="text-muted-foreground"> Trigger based on % change from entry price</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">ROI%:</span>
                        <span className="text-muted-foreground"> Trigger based on % return on margin (accounts for leverage)</span>
                      </div>
                    </div>
                  }
                  className="whitespace-normal"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={percentValue}
                  onChange={(e) => handlePercentChange(e.target.value)}
                  className="h-9 text-sm font-mono-numbers flex-1"
                  step="0.1"
                />
                <div className="flex items-center gap-1.5 text-xs bg-muted rounded-md px-2 py-1.5">
                  <span
                    className={`cursor-pointer transition-colors ${
                      !useRoi ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    onClick={() => handleToggleRoi(false)}
                  >
                    P%
                  </span>
                  <Switch
                    checked={useRoi}
                    onCheckedChange={handleToggleRoi}
                    className="scale-75"
                  />
                  <span
                    className={`cursor-pointer transition-colors ${
                      useRoi ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    onClick={() => handleToggleRoi(true)}
                  >
                    ROI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Est. P&L Display */}
          {triggerPrice && (
            <div className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-3 py-2">
              <span className="text-muted-foreground">Est. P&L:</span>
              <div className={`font-mono-numbers font-medium ${pnlColor}`}>
                <span>
                  {estPnl.sol >= 0 ? "+" : ""}
                  {estPnl.sol.toFixed(4)} SOL
                </span>
                <span className="ml-2 opacity-70">
                  ({estPnl.percent >= 0 ? "+" : ""}
                  {estPnl.percent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ MAIN ORDER FORM ============

export function OrderForm() {
  const wallet = useWallet();
  const { placeOrder, executeMarketOrder } = useDexProgram();
  const { selectedMarket, isLoading: marketLoading } = useSelectedMarket();
  const { collateral, exists: userExists } = useUserCollateral();

  // Form state
  const [direction, setDirection] = useState<PositionDirection>(
    PositionDirection.Long
  );
  const [orderType, setOrderType] = useState<OrderType>(OrderType.Market);
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [leverage, setLeverage] = useState(1);

  // TP/SL state
  const [tpEnabled, setTpEnabled] = useState(false);
  const [tpTriggerPrice, setTpTriggerPrice] = useState("");
  const [tpPercentValue, setTpPercentValue] = useState("");
  const [tpUseRoi, setTpUseRoi] = useState(false);

  const [slEnabled, setSlEnabled] = useState(false);
  const [slTriggerPrice, setSlTriggerPrice] = useState("");
  const [slPercentValue, setSlPercentValue] = useState("");
  const [slUseRoi, setSlUseRoi] = useState(false);

  const isLong = direction === PositionDirection.Long;
  const marketInfo = selectedMarket?.info;

  // Calculate estimated entry price
  const estimatedEntry = useMemo(() => {
    if (!marketInfo) return null;
    if (orderType === OrderType.Limit && price) {
      return new BN(parseFloat(price) * PRICE_PRECISION);
    }
    return isLong ? marketInfo.askPrice : marketInfo.bidPrice;
  }, [marketInfo, orderType, price, isLong]);

  // Entry price as number for TP/SL calculations
  const entryPriceNum = useMemo(() => {
    if (!estimatedEntry) return 0;
    return estimatedEntry.toNumber() / PRICE_PRECISION;
  }, [estimatedEntry]);

  // Size as number for P&L calculations
  const sizeNum = useMemo(() => {
    if (!size) return 0;
    return parseFloat(size);
  }, [size]);

  // Calculate position value and required margin
  const positionValue = useMemo(() => {
    if (!size || !estimatedEntry) return new BN(0);
    const sizeAmount = parseBaseAmount(size);
    return sizeAmount.mul(estimatedEntry).div(new BN(PRICE_PRECISION));
  }, [size, estimatedEntry]);

  const requiredMargin = useMemo(() => {
    if (leverage === 0) return new BN(0);
    return positionValue.div(new BN(leverage));
  }, [positionValue, leverage]);

  // Check if user has enough collateral
  const hasEnoughCollateral = useMemo(() => {
    if (!collateral) return false;
    return collateral.free.gte(requiredMargin);
  }, [collateral, requiredMargin]);

  // Reset TP/SL when direction changes
  useEffect(() => {
    setTpTriggerPrice("");
    setTpPercentValue("");
    setSlTriggerPrice("");
    setSlPercentValue("");
  }, [direction]);

  // Handle order submission
  const handleSubmit = async () => {
    if (!marketInfo || !size) return;

    const baseAssetAmount = parseBaseAmount(size);

    // For MARKET orders: Use atomic execution (Place + Fill + TP/SL in ONE transaction)
    if (orderType === OrderType.Market) {
      await executeMarketOrder.mutateAsync({
        marketIndex: marketInfo.marketIndex,
        direction,
        baseAssetAmount,
        // Include TP/SL if enabled
        takeProfit: tpEnabled && tpTriggerPrice 
          ? { triggerPrice: new BN(parseFloat(tpTriggerPrice) * PRICE_PRECISION) }
          : undefined,
        stopLoss: slEnabled && slTriggerPrice
          ? { triggerPrice: new BN(parseFloat(slTriggerPrice) * PRICE_PRECISION) }
          : undefined,
      });
    } else {
      // For LIMIT orders: Use traditional multi-transaction flow (keeper fills later)
      const mainParams = {
        marketIndex: marketInfo.marketIndex,
        direction,
        orderType,
        baseAssetAmount,
        price: price ? new BN(parseFloat(price) * PRICE_PRECISION) : undefined,
      };

      await placeOrder.mutateAsync(mainParams);

      // Place TP order if enabled (will trigger after limit order fills)
      if (tpEnabled && tpTriggerPrice) {
        const tpParams = {
          marketIndex: marketInfo.marketIndex,
          direction: isLong ? PositionDirection.Short : PositionDirection.Long,
          orderType: OrderType.TakeProfit,
          baseAssetAmount,
          triggerPrice: new BN(parseFloat(tpTriggerPrice) * PRICE_PRECISION),
          triggerCondition: isLong ? TriggerCondition.Above : TriggerCondition.Below,
          reduceOnly: true,
        };
        await placeOrder.mutateAsync(tpParams);
      }

      // Place SL order if enabled
      if (slEnabled && slTriggerPrice) {
        const slParams = {
          marketIndex: marketInfo.marketIndex,
          direction: isLong ? PositionDirection.Short : PositionDirection.Long,
          orderType: OrderType.StopLoss,
          baseAssetAmount,
          triggerPrice: new BN(parseFloat(slTriggerPrice) * PRICE_PRECISION),
          triggerCondition: isLong ? TriggerCondition.Below : TriggerCondition.Above,
          reduceOnly: true,
        };
        await placeOrder.mutateAsync(slParams);
      }
    }

    // Reset form
    setSize("");
    setPrice("");
    setTpEnabled(false);
    setTpTriggerPrice("");
    setTpPercentValue("");
    setSlEnabled(false);
    setSlTriggerPrice("");
    setSlPercentValue("");
  };

  // Validate TP/SL prices
  const tpSlValidation = useMemo(() => {
    const errors: string[] = [];

    if (tpEnabled && tpTriggerPrice && entryPriceNum > 0) {
      const tp = parseFloat(tpTriggerPrice);
      if (isLong && tp <= entryPriceNum) {
        errors.push("TP must be above entry for Long");
      }
      if (!isLong && tp >= entryPriceNum) {
        errors.push("TP must be below entry for Short");
      }
    }

    if (slEnabled && slTriggerPrice && entryPriceNum > 0) {
      const sl = parseFloat(slTriggerPrice);
      if (isLong && sl >= entryPriceNum) {
        errors.push("SL must be below entry for Long");
      }
      if (!isLong && sl <= entryPriceNum) {
        errors.push("SL must be above entry for Short");
      }
    }

    return errors;
  }, [tpEnabled, slEnabled, tpTriggerPrice, slTriggerPrice, entryPriceNum, isLong]);

  if (!wallet.connected) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Place Order</div>
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <p className="text-sm">Connect wallet to trade</p>
        </div>
      </div>
    );
  }

  if (marketLoading) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Place Order</div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!marketInfo) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Place Order</div>
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">Select a market to trade</p>
        </div>
      </div>
    );
  }

  if (!userExists) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Place Order</div>
        <div className="text-center text-muted-foreground py-8">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-sm">Create an account to start trading</p>
        </div>
      </div>
    );
  }

  // Day 3: Check if market is settled
  if (marketInfo?.status === MarketStatus.Settled) {
    return (
      <div className="trading-panel">
        <div className="trading-panel-header">Place Order</div>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium text-emerald-500 mb-2">Market Settled</p>
          <p className="text-sm text-muted-foreground">
            This market has been settled at{" "}
            <span className="font-mono-numbers font-medium">
              {formatPriceAsPercent(marketInfo.settlementPrice)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Go to your Account to settle any open positions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-panel">
      <div className="trading-panel-header">Place Order</div>

      {/* Direction Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          variant={isLong ? "default" : "outline"}
          className={`${
            isLong
              ? "bg-long hover:bg-long/90 text-white"
              : "hover:bg-long-muted/20 hover:text-long"
          }`}
          onClick={() => setDirection(PositionDirection.Long)}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Long / YES
        </Button>
        <Button
          variant={!isLong ? "default" : "outline"}
          className={`${
            !isLong
              ? "bg-short hover:bg-short/90 text-white"
              : "hover:bg-short-muted/20 hover:text-short"
          }`}
          onClick={() => setDirection(PositionDirection.Short)}
        >
          <TrendingDown className="h-4 w-4 mr-2" />
          Short / NO
        </Button>
      </div>

      {/* Order Type Tabs */}
      <Tabs
        value={orderType}
        onValueChange={(v) => setOrderType(v as OrderType)}
        className="mb-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value={OrderType.Market} className="flex-1">
            Market
          </TabsTrigger>
          <TabsTrigger value={OrderType.Limit} className="flex-1">
            Limit
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Size Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="size" className="text-sm text-muted-foreground">
            Size (SOL)
          </Label>
          <div className="relative">
            <Input
              id="size"
              type="number"
              placeholder="0.00"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="font-mono-numbers trading-input pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              SOL
            </span>
          </div>
        </div>

        {/* Limit Price (only for limit orders) */}
        {orderType === OrderType.Limit && (
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm text-muted-foreground">
              Limit Price ($)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="price"
              type="number"
                placeholder={formatPriceAsPercent(
                  isLong ? marketInfo.askPrice : marketInfo.bidPrice
                )}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono-numbers trading-input pl-7"
                step="0.01"
              />
            </div>
          </div>
        )}

        {/* Leverage Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Leverage</Label>
            <span className="font-mono-numbers text-sm font-medium">
              {leverage}x
            </span>
          </div>
          <Slider
            value={[leverage]}
            onValueChange={(v) => setLeverage(v[0])}
            min={1}
            max={MAX_LEVERAGE}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1x</span>
            <span>{MAX_LEVERAGE}x</span>
          </div>
        </div>

        {/* TP/SL Section */}
        <div className="border-t border-border pt-4 space-y-3">
          {/* Take Profit */}
          <TpSlRow
            label="Take Profit"
            type="tp"
            enabled={tpEnabled}
            onEnabledChange={setTpEnabled}
            triggerPrice={tpTriggerPrice}
            onTriggerPriceChange={setTpTriggerPrice}
            percentValue={tpPercentValue}
            onPercentValueChange={setTpPercentValue}
            useRoi={tpUseRoi}
            onUseRoiChange={setTpUseRoi}
            entryPrice={entryPriceNum}
            leverage={leverage}
            size={sizeNum}
            isLong={isLong}
          />

          {/* Stop Loss */}
          <TpSlRow
            label="Stop Loss"
            type="sl"
            enabled={slEnabled}
            onEnabledChange={setSlEnabled}
            triggerPrice={slTriggerPrice}
            onTriggerPriceChange={setSlTriggerPrice}
            percentValue={slPercentValue}
            onPercentValueChange={setSlPercentValue}
            useRoi={slUseRoi}
            onUseRoiChange={setSlUseRoi}
            entryPrice={entryPriceNum}
            leverage={leverage}
            size={sizeNum}
            isLong={isLong}
          />

          {/* Validation Errors */}
          {tpSlValidation.length > 0 && (
            <div className="text-xs text-short space-y-1">
              {tpSlValidation.map((error, i) => (
                <div key={i} className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Est. Entry Price</span>
            <span className="font-mono-numbers">
              {estimatedEntry ? formatPriceAsPercent(estimatedEntry) : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Position Value</span>
            <span className="font-mono-numbers">
              {formatSol(positionValue)} SOL
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Required Margin</span>
            <span
              className={`font-mono-numbers ${
                !hasEnoughCollateral && size ? "text-short" : ""
              }`}
            >
              {formatSol(requiredMargin)} SOL
            </span>
          </div>
          {(tpEnabled || slEnabled) && (
            <>
              {tpEnabled && tpTriggerPrice && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-long">Take Profit @</span>
                  <span className="font-mono-numbers text-long">
                    {parseFloat(tpTriggerPrice).toFixed(4)}
                  </span>
                </div>
              )}
              {slEnabled && slTriggerPrice && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-short">Stop Loss @</span>
                  <span className="font-mono-numbers text-short">
                    {parseFloat(slTriggerPrice).toFixed(4)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Insufficient Collateral Warning */}
        {size && !hasEnoughCollateral && (
          <div className="flex items-center gap-2 text-short text-sm bg-short-muted/20 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Insufficient collateral. Please deposit more SOL.</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          className={`w-full ${
            isLong ? "bg-long hover:bg-long/90" : "bg-short hover:bg-short/90"
          } text-white`}
          onClick={handleSubmit}
          disabled={
            !size ||
            parseFloat(size) <= 0 ||
            !hasEnoughCollateral ||
            placeOrder.isPending ||
            executeMarketOrder.isPending ||
            tpSlValidation.length > 0
          }
        >
          {placeOrder.isPending || executeMarketOrder.isPending
            ? orderType === OrderType.Market 
              ? "Executing Trade..." 
              : "Placing Order..."
            : `${isLong ? "Long" : "Short"} ${marketInfo.name}`}
        </Button>

        {/* Info */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            {orderType === OrderType.Market
              ? "Market orders execute instantly in one transaction."
              : "Limit orders wait until price is reached (keeper fills)."}
            {(tpEnabled || slEnabled) && orderType === OrderType.Market &&
              " TP/SL included in the same transaction."}
            {(tpEnabled || slEnabled) && orderType !== OrderType.Market &&
              " TP/SL orders placed separately."}
          </span>
        </div>
      </div>
    </div>
  );
}
