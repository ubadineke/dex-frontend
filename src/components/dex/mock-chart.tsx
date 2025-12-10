"use client";

import { useMemo } from "react";
import { useSelectedMarket } from "./dex-data-access";
import { TrendingUp, TrendingDown } from "lucide-react";

// Generate fake candlestick-like data
function generateMockData(basePrice: number, count: number = 50) {
  const data: { time: number; open: number; high: number; low: number; close: number }[] = [];
  let price = basePrice;
  
  for (let i = 0; i < count; i++) {
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;
    
    data.push({
      time: Date.now() - (count - i) * 3600000, // hourly candles
      open,
      high,
      low,
      close,
    });
    
    price = close;
  }
  
  return data;
}

export function MockChart() {
  const { selectedMarket } = useSelectedMarket();
  const marketInfo = selectedMarket?.info;

  const basePrice = marketInfo?.oraclePrice.toNumber() || 500000; // Default 50%
  const priceNum = basePrice / 1_000_000;

  const mockData = useMemo(() => {
    return generateMockData(priceNum, 60);
  }, [priceNum]);

  const minPrice = Math.min(...mockData.map(d => d.low));
  const maxPrice = Math.max(...mockData.map(d => d.high));
  const priceRange = maxPrice - minPrice;

  // Calculate change
  const firstClose = mockData[0]?.close || priceNum;
  const lastClose = mockData[mockData.length - 1]?.close || priceNum;
  const change = ((lastClose - firstClose) / firstClose) * 100;
  const isPositive = change >= 0;

  // SVG dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 60, bottom: 30, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const candleWidth = chartWidth / mockData.length * 0.7;
  const candleGap = chartWidth / mockData.length * 0.3;

  // Scale functions
  const xScale = (index: number) => padding.left + index * (chartWidth / mockData.length) + candleGap / 2;
  const yScale = (price: number) => padding.top + ((maxPrice - price) / priceRange) * chartHeight;

  // Generate grid lines
  const gridLines = 5;
  const priceStep = priceRange / gridLines;

  return (
    <div className="h-full flex flex-col">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold font-mono-numbers">
            {(lastClose * 100).toFixed(2)}%
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-long" : "text-short"}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-mono-numbers">
              {isPositive ? "+" : ""}{change.toFixed(2)}%
            </span>
            <span className="text-muted-foreground">24h</span>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          {["1H", "4H", "1D", "1W"].map((tf) => (
            <button
              key={tf}
              className={`px-2 py-1 rounded ${tf === "1H" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="flex-1 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid Lines */}
          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const price = maxPrice - i * priceStep;
            const y = yScale(price);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeDasharray="4 4"
                />
                <text
                  x={width - padding.right + 5}
                  y={y + 4}
                  fill="currentColor"
                  opacity={0.5}
                  fontSize="10"
                  className="font-mono-numbers"
                >
                  {(price * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Candlesticks */}
          {mockData.map((candle, i) => {
            const x = xScale(i);
            const isGreen = candle.close >= candle.open;
            const color = isGreen ? "var(--long)" : "var(--short)";
            
            const bodyTop = yScale(Math.max(candle.open, candle.close));
            const bodyBottom = yScale(Math.min(candle.open, candle.close));
            const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

            return (
              <g key={i}>
                {/* Wick */}
                <line
                  x1={x + candleWidth / 2}
                  x2={x + candleWidth / 2}
                  y1={yScale(candle.high)}
                  y2={yScale(candle.low)}
                  stroke={color}
                  strokeWidth={1}
                />
                {/* Body */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx={1}
                />
              </g>
            );
          })}

          {/* Current Price Line */}
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={yScale(lastClose)}
            y2={yScale(lastClose)}
            stroke={isPositive ? "var(--long)" : "var(--short)"}
            strokeWidth={1}
            strokeDasharray="4 2"
          />

          {/* Current Price Label */}
          <rect
            x={width - padding.right + 2}
            y={yScale(lastClose) - 10}
            width={50}
            height={20}
            rx={4}
            fill={isPositive ? "var(--long)" : "var(--short)"}
          />
          <text
            x={width - padding.right + 27}
            y={yScale(lastClose) + 4}
            fill="white"
            fontSize="10"
            textAnchor="middle"
            className="font-mono-numbers"
          >
            {(lastClose * 100).toFixed(1)}%
          </text>
        </svg>

        {/* Overlay gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
        <span>-60h</span>
        <span>-48h</span>
        <span>-36h</span>
        <span>-24h</span>
        <span>-12h</span>
        <span>Now</span>
      </div>
    </div>
  );
}

