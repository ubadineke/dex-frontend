'use client'

/**
 * Discover Markets Feature
 *
 * Fetches live markets from Polymarket API, filters by liquidity,
 * and allows admin to add markets to the DEX.
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import {
  Search,
  TrendingUp,
  Loader2,
  Plus,
  ExternalLink,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Globe,
  DollarSign,
  Clock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useDexProgram } from './dex-data-access'
import { useTransactionToast } from '../use-transaction-toast'
import { PRICE_PRECISION } from '@/lib/constants'

// ============ TYPES ============

interface PolymarketEvent {
  id: string
  title: string
  slug: string
  description: string
  endDate: string
  active: boolean
  closed: boolean
  markets: PolymarketMarket[]
  volume: number
  liquidity: number
}

interface PolymarketMarket {
  id: string
  question: string
  conditionId: string
  slug: string
  outcomes: string[]
  outcomePrices: string[]
  volume: string
  liquidity: string
  endDate: string
  active: boolean
  closed: boolean
}

interface DiscoverMarket {
  id: string // Polymarket market ID (for URL)
  conditionId: string
  question: string
  yesPrice: number
  noPrice: number
  volume: number
  liquidity: number
  endDate: string
  active: boolean
  closed: boolean
  slug: string
  isLiveOnDex: boolean
  dexMarketIndex?: number
}

// ============ CONSTANTS ============

const MIN_LIQUIDITY_USD = 50_000 // Minimum $50K liquidity
const MARKETS_PER_PAGE = 10

// ============ API HELPERS ============

async function fetchPolymarketEvents(offset: number = 0, limit: number = MARKETS_PER_PAGE): Promise<PolymarketEvent[]> {
  try {
    // Fetch via our API proxy to avoid CORS issues
    const response = await fetch(`/api/polymarket?limit=${limit}&offset=${offset}`)

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`)
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('[Polymarket] Failed to fetch events:', error)
    return []
  }
}

// ============ MAIN COMPONENT ============

export function DiscoverFeature() {
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const transactionToast = useTransactionToast()
  const { program, stateQuery, marketsQuery } = useDexProgram()

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'volume' | 'liquidity' | 'endDate'>('liquidity')
  const [loadedCount, setLoadedCount] = useState(MARKETS_PER_PAGE)
  const [addingMarket, setAddingMarket] = useState<string | null>(null)
  const [hideAddedMarkets, setHideAddedMarkets] = useState(true) // Hide already-added markets by default

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    if (!wallet.publicKey || !stateQuery.data) return false
    const adminKey = stateQuery.data.admin as PublicKey
    return adminKey && wallet.publicKey.equals(adminKey)
  }, [wallet.publicKey, stateQuery.data])

  // Get existing markets on DEX (by condition ID)
  const existingConditionIds = useMemo(() => {
    if (!marketsQuery.data) return new Set<string>()

    const ids = new Set<string>()
    for (const market of marketsQuery.data) {
      const account = market.account as { polymarketId?: number[] }
      if (account.polymarketId) {
        const conditionId = bytesToConditionId(account.polymarketId)
        if (conditionId) ids.add(conditionId)
      }
    }
    return ids
  }, [marketsQuery.data])

  // Fetch Polymarket events
  // Include existingConditionIds in key so it refetches when DEX markets change
  const existingIdsKey = Array.from(existingConditionIds).sort().join(',')
  const polymarketsQuery = useQuery({
    queryKey: ['polymarket', 'events', loadedCount, existingIdsKey],
    queryFn: async () => {
      const events = await fetchPolymarketEvents(0, loadedCount)

      // Transform events to discover markets
      const markets: DiscoverMarket[] = []

      for (const event of events) {
        for (const market of event.markets || []) {
          const liquidity = parseFloat(market.liquidity || '0')
          const volume = parseFloat(market.volume || '0')

          // Filter by minimum liquidity
          if (liquidity < MIN_LIQUIDITY_USD) continue

          // Parse prices - handle various API response formats
          let yesPrice = 0.5
          let noPrice = 0.5

          // outcomePrices can be an array of strings like ["0.55", "0.45"]
          // or the API might return them differently
          const prices = market.outcomePrices
          if (Array.isArray(prices) && prices.length >= 2) {
            const parsedYes = parseFloat(prices[0])
            const parsedNo = parseFloat(prices[1])
            if (!isNaN(parsedYes) && parsedYes > 0 && parsedYes < 1) {
              yesPrice = parsedYes
            }
            if (!isNaN(parsedNo) && parsedNo > 0 && parsedNo < 1) {
              noPrice = parsedNo
            }
          } else if (typeof prices === 'string') {
            // Sometimes it's a JSON string
            try {
              const parsed = JSON.parse(prices)
              if (Array.isArray(parsed) && parsed.length >= 2) {
                const parsedYes = parseFloat(parsed[0])
                const parsedNo = parseFloat(parsed[1])
                if (!isNaN(parsedYes)) yesPrice = parsedYes
                if (!isNaN(parsedNo)) noPrice = parsedNo
              }
            } catch {
              // Ignore parse errors
            }
          }

          // Skip markets with invalid prices (NaN or out of reasonable range)
          if (isNaN(yesPrice) || isNaN(noPrice)) continue
          if (yesPrice <= 0 || yesPrice >= 1 || noPrice <= 0 || noPrice >= 1) continue

          // Skip markets with extreme prices (outside tradeable range 0.05-0.95)
          // These markets are likely near resolution and not suitable for perp trading
          const isTradeable = yesPrice >= 0.05 && yesPrice <= 0.95
          if (!isTradeable) continue

          // Check if already on DEX
          const isLive = existingConditionIds.has(market.conditionId)
          const dexMarket = isLive
            ? marketsQuery.data?.find((m) => {
                const account = m.account as { polymarketId?: number[] }
                return account.polymarketId && bytesToConditionId(account.polymarketId) === market.conditionId
              })
            : undefined

          markets.push({
            id: market.id, // Polymarket market ID for URL
            conditionId: market.conditionId,
            question: market.question || event.title,
            yesPrice,
            noPrice,
            volume,
            liquidity,
            endDate: market.endDate || event.endDate,
            active: market.active && !market.closed,
            closed: market.closed,
            slug: market.slug || event.slug,
            isLiveOnDex: isLive,
            dexMarketIndex: dexMarket?.info.marketIndex,
          })
        }
      }

      return markets
    },
    staleTime: 60_000, // 1 minute
    enabled: true,
  })

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    if (!polymarketsQuery.data) return []

    let markets = [...polymarketsQuery.data]

    // Filter out already-added markets if toggle is on
    if (hideAddedMarkets) {
      markets = markets.filter((m) => !m.isLiveOnDex)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      markets = markets.filter((m) => m.question.toLowerCase().includes(query))
    }

    // Sort
    switch (sortBy) {
      case 'volume':
        markets.sort((a, b) => b.volume - a.volume)
        break
      case 'liquidity':
        markets.sort((a, b) => b.liquidity - a.liquidity)
        break
      case 'endDate':
        markets.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        break
    }

    return markets
  }, [polymarketsQuery.data, searchQuery, sortBy, hideAddedMarkets])

  // Add market mutation
  const addMarketMutation = useMutation({
    mutationKey: ['dex', 'addMarket'],
    mutationFn: async (market: DiscoverMarket) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')
      if (!isAdmin) throw new Error('Only admin can add markets')
      if (!stateQuery.data) throw new Error('State not loaded')

      // Get the next market index from the state
      const nextMarketIndex = (stateQuery.data as { numberOfMarkets: number }).numberOfMarkets

      // Derive Oracle PDA for this market index
      const ORACLE_SEED = Buffer.from('oracle')
      const indexBuffer = Buffer.alloc(2)
      indexBuffer.writeUInt16LE(nextMarketIndex)
      const [oraclePda] = PublicKey.findProgramAddressSync([ORACLE_SEED, indexBuffer], program.programId)

      // Prepare market params
      const name = stringToBytes32(market.question.slice(0, 31))
      const polymarketId = stringToBytes64(market.conditionId)

      // Derive Polymarket Marker PDA - this prevents duplicate markets
      // Use first 32 bytes of polymarket_id (max seed length for Solana PDAs)
      const POLYMARKET_MARKER_SEED = Buffer.from('polymarket_marker')
      const polymarketIdBuffer = Buffer.from(polymarketId)
      const seedBytes = polymarketIdBuffer.slice(0, 32)
      const [polymarketMarkerPda] = PublicKey.findProgramAddressSync(
        [POLYMARKET_MARKER_SEED, seedBytes],
        program.programId
      )

      // Calculate initial price (scaled to PRICE_PRECISION)
      // Price is already validated to be in 0.05-0.95 range during discovery
      const initialPrice = new BN(Math.floor(market.yesPrice * PRICE_PRECISION))

      // Calculate expiry timestamp
      const expiryTs = new BN(Math.floor(new Date(market.endDate).getTime() / 1000))

      // Calculate initial liquidity based on market liquidity
      // Higher Polymarket liquidity = higher sqrt_k for our AMM
      const liquidityMultiplier = Math.max(1, Math.floor(market.liquidity / 100_000))
      const initialLiquidity = new BN(100_000_000_000).muln(liquidityMultiplier) // 100B * multiplier

      const params = {
        name,
        polymarketId,
        initialPrice,
        expiryTs,
        initialLiquidity,
      }

      // Call addMarket - oracle and marker are PDAs, no signer needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts: any = {
        admin: wallet.publicKey,
        oracle: oraclePda,
        polymarketMarker: polymarketMarkerPda,
      }
      const signature = await program.methods
        .addMarket(params as never)
        .accounts(accounts)
        .rpc()

      return { signature, marketQuestion: market.question }
    },
    onSuccess: ({ signature, marketQuestion }) => {
      transactionToast(signature)
      toast.success(`Market "${marketQuestion.slice(0, 30)}..." added to DEX!`)
      queryClient.invalidateQueries({ queryKey: ['dex', 'markets'] })
      queryClient.invalidateQueries({ queryKey: ['polymarket'] })
      setAddingMarket(null)
    },
    onError: (error: Error) => {
      console.error('[AddMarket] Failed:', error)
      // Check for duplicate market error (account already exists)
      const errorMsg = error.message
      if (errorMsg.includes('already in use') || errorMsg.includes('already been processed')) {
        toast.error('This market already exists on the DEX!')
      } else {
        toast.error(`Failed to add market: ${errorMsg}`)
      }
      setAddingMarket(null)
    },
  })

  const handleAddMarket = (market: DiscoverMarket) => {
    // Prevent adding duplicate markets
    if (existingConditionIds.has(market.conditionId)) {
      toast.error('This market is already on the DEX!')
      return
    }
    setAddingMarket(market.conditionId)
    addMarketMutation.mutate(market)
  }

  const handleLoadMore = () => {
    setLoadedCount((prev) => prev + MARKETS_PER_PAGE)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['polymarket'] })
  }

  // Stats
  const stats = useMemo(() => {
    const markets = polymarketsQuery.data || []
    const liveOnDex = markets.filter((m) => m.isLiveOnDex).length
    const totalVolume = markets.reduce((acc, m) => acc + m.volume, 0)
    const totalLiquidity = markets.reduce((acc, m) => acc + m.liquidity, 0)

    return { total: markets.length, liveOnDex, totalVolume, totalLiquidity }
  }, [polymarketsQuery.data])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Discover Markets</h1>
        </div>
        <p className="text-muted-foreground">
          Browse live prediction markets from Polymarket. Add high-liquidity markets to enable leveraged trading.
        </p>
      </div>

      {/* Admin Badge */}
      {isAdmin && (
        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary">Admin Mode Active</span>
            <span className="text-sm text-muted-foreground">— You can add markets to the DEX</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Globe className="h-4 w-4" />
              Markets Found
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-long/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="h-4 w-4" />
              Live on DEX
            </div>
            <div className="text-2xl font-bold text-long">{stats.liveOnDex}</div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Volume
            </div>
            <div className="text-2xl font-bold">${formatCompact(stats.totalVolume)}</div>
          </CardContent>
        </Card>

        <Card className="bg-short/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Total Liquidity
            </div>
            <div className="text-2xl font-bold">${formatCompact(stats.totalLiquidity)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Toggle to show/hide already added markets */}
          <Button
            variant={hideAddedMarkets ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHideAddedMarkets(!hideAddedMarkets)}
            className="gap-2"
          >
            {hideAddedMarkets ? (
              <>
                <CheckCircle className="h-4 w-4" />
                New Only
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Show All
              </>
            )}
          </Button>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="liquidity">Highest Liquidity</SelectItem>
              <SelectItem value="volume">Highest Volume</SelectItem>
              <SelectItem value="endDate">Ending Soon</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={polymarketsQuery.isFetching}>
            <RefreshCw className={`h-4 w-4 ${polymarketsQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Market Grid */}
      {polymarketsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      ) : polymarketsQuery.isError ? (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold">Failed to load markets</h3>
              <p className="text-sm text-muted-foreground">Could not connect to Polymarket API. Please try again.</p>
            </div>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      ) : filteredMarkets.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Search className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No markets found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : `No markets with ≥$${formatCompact(MIN_LIQUIDITY_USD)} liquidity found`}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMarkets.map((market) => (
              <MarketCard
                key={market.conditionId}
                market={market}
                isAdmin={isAdmin}
                isAdding={addingMarket === market.conditionId}
                onAdd={() => handleAddMarket(market)}
              />
            ))}
          </div>

          {/* Load More */}
          {filteredMarkets.length >= loadedCount && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" size="lg" onClick={handleLoadMore} disabled={polymarketsQuery.isFetching}>
                {polymarketsQuery.isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>Load More Markets</>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============ SUBCOMPONENTS ============

interface MarketCardProps {
  market: DiscoverMarket
  isAdmin: boolean
  isAdding: boolean
  onAdd: () => void
}

function MarketCard({ market, isAdmin, isAdding, onAdd }: MarketCardProps) {
  const yesPct = (market.yesPrice * 100).toFixed(0)
  const noPct = (market.noPrice * 100).toFixed(0)
  const endDate = new Date(market.endDate)
  const isExpiringSoon = endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 // 7 days

  return (
    <Card
      className={`transition-all hover:shadow-md ${market.isLiveOnDex ? 'border-long/30 bg-long/5' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight line-clamp-2">{market.question}</CardTitle>
          {market.isLiveOnDex && (
            <Badge variant="outline" className="shrink-0 border-long text-long bg-long/10">
              <CheckCircle className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-2 mt-1">
          <Clock className="h-3 w-3" />
          {isExpiringSoon && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Ending Soon
            </Badge>
          )}
          <span>{endDate.toLocaleDateString()}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Price Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-long font-medium">YES {yesPct}%</span>
            <span className="text-short font-medium">NO {noPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-short-muted overflow-hidden">
            <div className="h-full bg-long rounded-full transition-all" style={{ width: `${yesPct}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground text-xs">Volume</div>
              <div className="font-medium">${formatCompact(market.volume)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground text-xs">Liquidity</div>
              <div className="font-medium">${formatCompact(market.liquidity)}</div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        {market.isLiveOnDex ? (
          <Button variant="outline" className="flex-1" asChild>
            <a href={`/trade?market=${market.dexMarketIndex}`}>
              Trade on DEX
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        ) : isAdmin ? (
          <Button className="flex-1" onClick={onAdd} disabled={isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to DEX
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" className="flex-1" disabled>
            <span className="text-muted-foreground">Admin Only</span>
          </Button>
        )}

        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <a
            href={`https://polymarket.com/event/${market.slug}?tid=${market.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Polymarket"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

function MarketCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3 mt-2" />
      </CardHeader>
      <CardContent className="pb-3">
        <Skeleton className="h-2 w-full rounded-full mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}

// ============ HELPERS ============

function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toFixed(0)
}

function stringToBytes32(str: string): number[] {
  const bytes = new Array(32).fill(0)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str.slice(0, 32))
  for (let i = 0; i < encoded.length && i < 32; i++) {
    bytes[i] = encoded[i]
  }
  return bytes
}

function stringToBytes64(str: string): number[] {
  const bytes = new Array(64).fill(0)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str.slice(0, 64))
  for (let i = 0; i < encoded.length && i < 64; i++) {
    bytes[i] = encoded[i]
  }
  return bytes
}

function bytesToConditionId(bytes: number[]): string | null {
  try {
    const decoder = new TextDecoder()
    const nonZeroBytes = bytes.filter((b) => b !== 0)
    if (nonZeroBytes.length === 0) return null
    return decoder.decode(new Uint8Array(nonZeroBytes))
  } catch {
    return null
  }
}
