"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { TrendingUp, TrendingDown, X, CheckCircle2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import {
  useDexProgram,
  useUserPositions,
  PositionDirection,
} from "./dex-data-access";
import {
  formatBaseAmount,
  formatPriceAsPercent,
  formatPnl,
} from "@/lib/format";

export function PositionsTable() {
  const wallet = useWallet();
  const { closePosition, settlePosition } = useDexProgram();
  const { positions, isLoading } = useUserPositions();
  const [closingPosition, setClosingPosition] = useState<number | null>(null);
  const [settlingPosition, setSettlingPosition] = useState<number | null>(null);

  if (!wallet.connected) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Connect wallet to view positions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No open positions</p>
        <p className="text-xs mt-1">Your active positions will appear here</p>
      </div>
    );
  }

  const handleClose = async (marketIndex: number) => {
    await closePosition.mutateAsync(marketIndex);
    setClosingPosition(null);
  };

  // Day 3: Handle position settlement for settled markets
  const handleSettle = async (marketIndex: number) => {
    await settlePosition.mutateAsync(marketIndex);
    setSettlingPosition(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Mark</TableHead>
              <TableHead className="text-right">PnL</TableHead>
              <TableHead className="text-center">TP / SL</TableHead>
              <TableHead className="text-right">Liq.</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => {
              const pnl = formatPnl(position.unrealizedPnl);
              const isLong = position.direction === PositionDirection.Long;
              const isSettled = position.isMarketSettled;
              const hasTP = position.takeProfitPrice !== null;
              const hasSL = position.stopLossPrice !== null;

              return (
                <TableRow key={position.marketIndex} className={`position-row ${isSettled ? 'bg-emerald-500/5' : ''}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {position.marketName}
                      {isSettled && (
                        <Tooltip 
                          content={
                            <div>
                              <p>Market settled at {formatPriceAsPercent(position.settlementPrice)}</p>
                              <p className="text-xs text-muted-foreground">Settle to claim P&L</p>
                            </div>
                          }
                          side="right"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 cursor-help" />
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isLong ? "long" : "short"}>
                      {isLong ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {isLong ? "Long" : "Short"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono-numbers">
                    {formatBaseAmount(position.size)}
                  </TableCell>
                  <TableCell className="text-right font-mono-numbers">
                    {formatPriceAsPercent(position.entryPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono-numbers">
                    {isSettled ? (
                      <span className="text-emerald-500">{formatPriceAsPercent(position.settlementPrice)}</span>
                    ) : (
                      formatPriceAsPercent(position.markPrice)
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono-numbers ${
                      pnl.isPositive
                        ? "text-long"
                        : pnl.isNegative
                          ? "text-short"
                          : ""
                    }`}
                  >
                    {pnl.value}
                  </TableCell>
                  {/* TP / SL Column - shows attached exit orders */}
                  <TableCell className="text-center">
                    {isSettled ? (
                      <span className="text-xs text-muted-foreground">-</span>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 text-xs font-mono-numbers">
                        {hasTP ? (
                          <span className="text-long">
                            TP: {formatPriceAsPercent(position.takeProfitPrice!)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">TP: -</span>
                        )}
                        {hasSL ? (
                          <span className="text-short">
                            SL: {formatPriceAsPercent(position.stopLossPrice!)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">SL: -</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono-numbers text-muted-foreground">
                    {isSettled ? (
                      <span className="text-xs text-emerald-500">N/A</span>
                    ) : (
                      formatPriceAsPercent(position.liquidationPrice)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isSettled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => setSettlingPosition(position.marketIndex)}
                      >
                        <Banknote className="h-3 w-3 mr-1" />
                        Settle
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs hover:text-short hover:bg-short-muted/20"
                        onClick={() => setClosingPosition(position.marketIndex)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Close
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Close Position Confirmation */}
      <Dialog
        open={closingPosition !== null}
        onOpenChange={() => setClosingPosition(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Position</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this position? This will execute a
              market order to close your entire position.
            </DialogDescription>
          </DialogHeader>

          {closingPosition !== null && (
            <div className="py-4">
              {(() => {
                const position = positions.find(
                  (p) => p.marketIndex === closingPosition
                );
                if (!position) return null;
                const pnl = formatPnl(position.unrealizedPnl);

                return (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Market</span>
                      <span className="font-medium">{position.marketName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-mono-numbers">
                        {formatBaseAmount(position.size)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Est. PnL</span>
                      <span
                        className={`font-mono-numbers font-medium ${
                          pnl.isPositive
                            ? "text-long"
                            : pnl.isNegative
                              ? "text-short"
                              : ""
                        }`}
                      >
                        {pnl.value}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setClosingPosition(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                closingPosition !== null && handleClose(closingPosition)
              }
              disabled={closePosition.isPending}
            >
              {closePosition.isPending ? "Closing..." : "Close Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day 3: Settle Position Confirmation */}
      <Dialog
        open={settlingPosition !== null}
        onOpenChange={() => setSettlingPosition(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Settle Position
            </DialogTitle>
            <DialogDescription>
              This market has settled. Settling your position will calculate your
              final P&L based on the settlement price and return funds to your collateral.
            </DialogDescription>
          </DialogHeader>

          {settlingPosition !== null && (
            <div className="py-4">
              {(() => {
                const position = positions.find(
                  (p) => p.marketIndex === settlingPosition
                );
                if (!position) return null;
                const pnl = formatPnl(position.unrealizedPnl);

                return (
                  <div className="space-y-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Market</span>
                        <span className="font-medium">{position.marketName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Settlement Price</span>
                        <span className="font-mono-numbers text-emerald-500 font-medium">
                          {formatPriceAsPercent(position.settlementPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Entry Price</span>
                        <span className="font-mono-numbers">
                          {formatPriceAsPercent(position.entryPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-mono-numbers">
                          {formatBaseAmount(position.size)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Final P&L</span>
                        <span
                          className={`font-mono-numbers text-lg font-bold ${
                            pnl.isPositive
                              ? "text-long"
                              : pnl.isNegative
                                ? "text-short"
                                : ""
                          }`}
                        >
                          {pnl.value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettlingPosition(null)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() =>
                settlingPosition !== null && handleSettle(settlingPosition)
              }
              disabled={settlePosition.isPending}
            >
              {settlePosition.isPending ? "Settling..." : "Settle & Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

