"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelectedMarket } from "./dex-data-access";
import { formatPriceAsPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function MarketSelector() {
  const { selectedIndex, setSelectedIndex, selectedMarket, markets, isLoading } =
    useSelectedMarket();

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
        <span>No markets available</span>
      </div>
    );
  }

  const currentMarket = selectedMarket?.info;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-auto py-2 px-3 flex items-center gap-3 min-w-[200px] justify-between"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {currentMarket?.name || "Select Market"}
            </span>
            {currentMarket && (
              <span className="text-xs text-muted-foreground font-mono-numbers">
                YES: {formatPriceAsPercent(currentMarket.oraclePrice)}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        {markets.map((market) => {
          const info = market.info;
          const isSelected = info.marketIndex === selectedIndex;

          return (
            <DropdownMenuItem
              key={info.marketIndex}
              onClick={() => setSelectedIndex(info.marketIndex)}
              className={`flex items-center justify-between py-3 px-3 cursor-pointer ${
                isSelected ? "bg-accent" : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{info.name}</span>
                <span className="text-xs text-muted-foreground">
                  Market #{info.marketIndex}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono-numbers text-sm font-medium">
                  {formatPriceAsPercent(info.oraclePrice)}
                </span>
                <Badge
                  variant={info.status === "active" ? "success" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {info.status}
                </Badge>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

