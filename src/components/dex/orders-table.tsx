"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { TrendingUp, TrendingDown, X } from "lucide-react";
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
import {
  useDexProgram,
  useUserOrders,
  PositionDirection,
  OrderType,
} from "./dex-data-access";
import { formatBaseAmount, formatPriceAsPercent } from "@/lib/format";

export function OrdersTable() {
  const wallet = useWallet();
  const { cancelOrder } = useDexProgram();
  const { orders, isLoading } = useUserOrders();
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);

  // Separate limit orders from TP/SL (exit orders)
  // TP/SL are shown in the Positions table as attached exit conditions
  const limitOrders = orders.filter(
    (o) => o.orderType === OrderType.Limit || o.orderType === OrderType.Market
  );
  const exitOrders = orders.filter(
    (o) => o.orderType === OrderType.TakeProfit || o.orderType === OrderType.StopLoss
  );

  if (!wallet.connected) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Connect wallet to view orders</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (limitOrders.length === 0 && exitOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No open orders</p>
        <p className="text-xs mt-1">Your pending limit orders will appear here</p>
      </div>
    );
  }

  const handleCancel = async (orderId: number) => {
    await cancelOrder.mutateAsync(orderId);
    setCancellingOrder(null);
  };

  const formatOrderType = (type: OrderType): string => {
    switch (type) {
      case OrderType.Market:
        return "Market";
      case OrderType.Limit:
        return "Limit";
      case OrderType.StopLoss:
        return "Stop Loss";
      case OrderType.TakeProfit:
        return "Take Profit";
      default:
        return "Unknown";
    }
  };

  return (
    <>
      {/* Limit Orders Section */}
      {limitOrders.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {limitOrders.map((order) => {
                const isLong = order.direction === PositionDirection.Long;

                return (
                  <TableRow key={order.orderId} className="position-row">
                    <TableCell className="font-medium">
                      {order.marketName}
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
                    <TableCell>
                      <Badge variant="secondary">
                        {formatOrderType(order.orderType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono-numbers">
                      {formatBaseAmount(order.size)}
                    </TableCell>
                    <TableCell className="text-right font-mono-numbers">
                      {order.price.isZero()
                        ? "Market"
                        : formatPriceAsPercent(order.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs hover:text-short hover:bg-short-muted/20"
                        onClick={() => setCancellingOrder(order.orderId)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Exit Orders (TP/SL) - shown separately with explanation */}
      {exitOrders.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2 px-1">
            Exit Orders (attached to positions - also shown in Positions tab)
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Trigger</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exitOrders.map((order) => (
                  <TableRow key={order.orderId} className="position-row">
                    <TableCell className="font-medium">
                      {order.marketName}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          order.orderType === OrderType.TakeProfit 
                            ? "bg-long/20 text-long border-long/30"
                            : "bg-short/20 text-short border-short/30"
                        }
                      >
                        {formatOrderType(order.orderType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono-numbers">
                      {formatPriceAsPercent(order.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs hover:text-short hover:bg-short-muted/20"
                        onClick={() => setCancellingOrder(order.orderId)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Empty state when no limit orders but has exit orders */}
      {limitOrders.length === 0 && exitOrders.length > 0 && (
        <div className="text-center py-4 text-muted-foreground mb-4">
          <p className="text-sm">No pending limit orders</p>
        </div>
      )}

      {/* Cancel Order Confirmation */}
      <Dialog
        open={cancellingOrder !== null}
        onOpenChange={() => setCancellingOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order?
            </DialogDescription>
          </DialogHeader>

          {cancellingOrder !== null && (
            <div className="py-4">
              {(() => {
                // Search in all orders (limit + exit)
                const order = [...limitOrders, ...exitOrders].find((o) => o.orderId === cancellingOrder);
                if (!order) return null;

                const isExitOrder = order.orderType === OrderType.TakeProfit || order.orderType === OrderType.StopLoss;

                return (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Market</span>
                      <span className="font-medium">{order.marketName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span>{formatOrderType(order.orderType)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-mono-numbers">
                        {formatBaseAmount(order.size)}
                      </span>
                    </div>
                    {isExitOrder && (
                      <div className="mt-2 text-xs text-short bg-short/10 p-2 rounded">
                        Cancelling this will remove the {order.orderType === OrderType.TakeProfit ? 'take profit' : 'stop loss'} protection from your position.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingOrder(null)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancellingOrder !== null && handleCancel(cancellingOrder)
              }
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


