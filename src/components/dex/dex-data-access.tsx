'use client'

/**
 * DEX Data Access Layer
 *
 * Provides hooks for interacting with the Prediction Perp DEX program.
 * Uses React Query for caching and Anchor for program interaction.
 */

import { Program, BN } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { atom, useAtom } from 'jotai'

import predPerpDexIDL from '@/idl/pred_perp_dex.json'
import { PredPerpDex } from '@/idl/pred_perp_dex'
import { PROGRAM_ID, STATE_SEED, USER_SEED, MARKET_SEED, COLLATERAL_VAULT_SEED, PRICE_PRECISION, BASE_PRECISION, MARGIN_PRECISION, DEFAULT_MAINTENANCE_MARGIN_RATIO, MAX_PREDICTION_PRICE } from '@/lib/constants'
import { bytesToString } from '@/lib/format'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'

// ============ TYPES ============

export enum PositionDirection {
  Long = 'long',
  Short = 'short',
}

export enum OrderType {
  Market = 'market',
  Limit = 'limit',
  StopLoss = 'stopLoss',
  TakeProfit = 'takeProfit',
}

export enum OrderStatus {
  Init = 'init',
  Open = 'open',
  Filled = 'filled',
  Cancelled = 'cancelled',
}

export enum MarketStatus {
  Uninitialized = 'uninitialized',
  Active = 'active',
  Paused = 'paused',
  Settled = 'settled',
}

export enum TriggerCondition {
  Above = 'above',
  Below = 'below',
}

export interface DexMarketInfo {
  marketIndex: number
  name: string
  status: MarketStatus
  oraclePrice: BN
  bidPrice: BN
  askPrice: BN
  openInterestLong: BN
  openInterestShort: BN
  // Day 3: Funding & Settlement
  settlementPrice: BN
  lastFundingRate: BN
  lastFundingRateTs: BN
  fundingPeriod: BN
  cumulativeFundingRateLong: BN
  cumulativeFundingRateShort: BN
}

export interface PositionInfo {
  marketIndex: number
  direction: PositionDirection
  size: BN
  entryPrice: BN
  unrealizedPnl: BN
  liquidationPrice: BN
}

export interface OrderParams {
  marketIndex: number
  direction: PositionDirection
  orderType: OrderType
  baseAssetAmount: BN
  price?: BN
  triggerPrice?: BN
  triggerCondition?: TriggerCondition
  reduceOnly?: boolean
  postOnly?: boolean
  maxTs?: BN
}

// ============ ATOMS (Global State) ============

// Selected market index
export const selectedMarketIndexAtom = atom<number>(0)

// ============ PDA HELPERS ============

export function getStatePda(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([STATE_SEED], programId)
}

export function getCollateralVaultPda(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([COLLATERAL_VAULT_SEED], programId)
}

export function getUserPda(authority: PublicKey, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([USER_SEED, authority.toBuffer()], programId)
}

export function getMarketPda(marketIndex: number, programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16LE(marketIndex)
  return PublicKey.findProgramAddressSync([MARKET_SEED, buffer], programId)
}

// ============ PROGRAM HOOK ============

export function useDexProgram() {
  const { connection } = useConnection()
  const provider = useAnchorProvider()
  const wallet = useWallet()
  const transactionToast = useTransactionToast()
  const queryClient = useQueryClient()

  const programId = PROGRAM_ID

  const program = useMemo(() => {
    if (!provider) return null
    return new Program<PredPerpDex>(predPerpDexIDL as PredPerpDex, provider)
  }, [provider])

  // ============ QUERY: Protocol State ============
  const stateQuery = useQuery({
    queryKey: ['dex', 'state', { endpoint: connection.rpcEndpoint }],
    queryFn: async () => {
      if (!program) throw new Error('Program not initialized')
      const [statePda] = getStatePda()
      const state = await program.account.state.fetch(statePda)
      return state
    },
    enabled: !!program,
    staleTime: 30_000, // 30 seconds
  })

  // ============ QUERY: All Markets ============
  const marketsQuery = useQuery({
    queryKey: ['dex', 'markets', { endpoint: connection.rpcEndpoint }],
    queryFn: async () => {
      if (!program) throw new Error('Program not initialized')
      const accounts = await program.account.predictionMarket.all()
      return accounts.map((a: { publicKey: PublicKey; account: Record<string, unknown> }) => ({
        publicKey: a.publicKey,
        account: a.account,
        info: parseMarketInfo(a.account),
      }))
    },
    enabled: !!program,
    staleTime: 10_000, // 10 seconds
  })

  // ============ QUERY: User Account ============
  const userQuery = useQuery({
    queryKey: ['dex', 'user', { endpoint: connection.rpcEndpoint, wallet: wallet.publicKey?.toBase58() }],
    queryFn: async () => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')
      const [userPda] = getUserPda(wallet.publicKey)
      try {
        const user = await program.account.user.fetch(userPda)
        return user
      } catch {
        return null // User doesn't exist yet
      }
    },
    enabled: !!program && !!wallet.publicKey,
    staleTime: 5_000, // 5 seconds
  })

  // ============ MUTATION: Initialize User ============
  const initializeUser = useMutation({
    mutationKey: ['dex', 'initializeUser'],
    mutationFn: async () => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      const signature = await program.methods
        .initializeUser()
        .accounts({
          authority: wallet.publicKey,
        })
        .rpc()

      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to initialize user: ${error.message}`)
    },
  })

  // ============ MUTATION: Deposit ============
  const deposit = useMutation({
    mutationKey: ['dex', 'deposit'],
    mutationFn: async (amount: BN) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      const signature = await program.methods
        .deposit(amount)
        .accounts({
          authority: wallet.publicKey,
        })
        .rpc()

      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
    },
    onError: (error: Error) => {
      toast.error(`Deposit failed: ${error.message}`)
    },
  })

  // ============ MUTATION: Withdraw (with margin check) ============
  const withdraw = useMutation({
    mutationKey: ['dex', 'withdraw'],
    mutationFn: async (amount: BN) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      const signature = await program.methods
        .withdraw(amount)
        .accounts({
          authority: wallet.publicKey,
        })
        .rpc()

      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Withdrawal successful')
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
    },
    onError: (error: Error) => {
      console.error('[withdraw] Failed:', error)
      if (error.message.includes('WithdrawalExceedsFreeCollateral')) {
        toast.error('Cannot withdraw: insufficient free collateral. Close some positions first.')
      } else if (error.message.includes('InsufficientMargin')) {
        toast.error('Cannot withdraw: would put account below margin requirement.')
      } else {
        toast.error(`Withdrawal failed: ${error.message}`)
      }
    },
  })

  // ============ MUTATION: Place Order ============
  const placeOrder = useMutation({
    mutationKey: ['dex', 'placeOrder'],
    mutationFn: async (params: OrderParams) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      const orderParams = {
        marketIndex: params.marketIndex,
        direction: params.direction === PositionDirection.Long ? { long: {} } : { short: {} },
        orderType: toAnchorOrderType(params.orderType),
        baseAssetAmount: params.baseAssetAmount,
        price: params.price || new BN(0),
        triggerPrice: params.triggerPrice || new BN(0),
        triggerCondition: params.triggerCondition === TriggerCondition.Above ? { above: {} } : { below: {} },
        reduceOnly: params.reduceOnly || false,
        postOnly: params.postOnly || false,
        maxTs: params.maxTs || new BN(0),
      }

      const signature = await program.methods
        .placeOrder(orderParams)
        .accounts({
          authority: wallet.publicKey,
        })
        .rpc()

      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Order placed successfully!')
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
      queryClient.invalidateQueries({ queryKey: ['dex', 'markets'] })
    },
    onError: (error: Error) => {
      toast.error(`Order failed: ${error.message}`)
    },
  })

  // ============ MUTATION: Execute Market Order (Atomic - Place + Fill + TP/SL in ONE TX) ============
  const executeMarketOrder = useMutation({
    mutationKey: ['dex', 'executeMarketOrder'],
    mutationFn: async (params: {
      marketIndex: number
      direction: PositionDirection
      baseAssetAmount: BN
      takeProfit?: { triggerPrice: BN }
      stopLoss?: { triggerPrice: BN }
    }) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      const { Transaction } = await import('@solana/web3.js')
      type Instruction = Awaited<ReturnType<ReturnType<typeof program.methods.placeOrder>['instruction']>>
      const instructions: Instruction[] = []

      const [userPda] = getUserPda(wallet.publicKey)
      const [marketPda] = getMarketPda(params.marketIndex)

      // 1. Place market order instruction
      const placeOrderIx = await program.methods
        .placeOrder({
          marketIndex: params.marketIndex,
          direction: params.direction === PositionDirection.Long ? { long: {} } : { short: {} },
          orderType: { market: {} },
          baseAssetAmount: params.baseAssetAmount,
          price: new BN(0),
          triggerPrice: new BN(0),
          triggerCondition: { above: {} },
          reduceOnly: false,
          postOnly: false,
          maxTs: new BN(0),
        })
        .accounts({
          authority: wallet.publicKey,
        })
        .instruction()
      instructions.push(placeOrderIx)

      // 2. Fill order instruction (user fills their own order)
      // Get next order ID
      const userData = await program.account.user.fetch(userPda)
      const nextOrderId = (userData as unknown as { nextOrderId: number }).nextOrderId || 0

      const fillOrderIx = await program.methods
        .fillOrder(nextOrderId)
        .accounts({
          filler: wallet.publicKey,
          user: userPda,
          market: marketPda,
        })
        .instruction()
      instructions.push(fillOrderIx)

      // 3. Take Profit order if specified
      if (params.takeProfit) {
        const tpDirection = params.direction === PositionDirection.Long ? { short: {} } : { long: {} }
        const tpCondition = params.direction === PositionDirection.Long ? { above: {} } : { below: {} }

        const tpOrderIx = await program.methods
          .placeOrder({
            marketIndex: params.marketIndex,
            direction: tpDirection,
            orderType: { takeProfit: {} },
            baseAssetAmount: params.baseAssetAmount,
            price: new BN(0),
            triggerPrice: params.takeProfit.triggerPrice,
            triggerCondition: tpCondition,
            reduceOnly: true,
            postOnly: false,
            maxTs: new BN(0),
          })
          .accounts({
            authority: wallet.publicKey,
          })
          .instruction()
        instructions.push(tpOrderIx)
      }

      // 4. Stop Loss order if specified
      if (params.stopLoss) {
        const slDirection = params.direction === PositionDirection.Long ? { short: {} } : { long: {} }
        const slCondition = params.direction === PositionDirection.Long ? { below: {} } : { above: {} }

        const slOrderIx = await program.methods
          .placeOrder({
            marketIndex: params.marketIndex,
            direction: slDirection,
            orderType: { stopLoss: {} },
            baseAssetAmount: params.baseAssetAmount,
            price: new BN(0),
            triggerPrice: params.stopLoss.triggerPrice,
            triggerCondition: slCondition,
            reduceOnly: true,
            postOnly: false,
            maxTs: new BN(0),
          })
          .accounts({
            authority: wallet.publicKey,
          })
          .instruction()
        instructions.push(slOrderIx)
      }

      // Execute all in ONE transaction
      const tx = new Transaction()
      instructions.forEach((ix) => tx.add(ix))

      // Use provider to send the batched transaction
      type Provider = { sendAndConfirm: (tx: InstanceType<typeof Transaction>, signers: unknown[]) => Promise<string> }
      const signature = await (program.provider as unknown as Provider).sendAndConfirm(tx, [])
      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Trade executed! Position opened instantly.')
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
      queryClient.invalidateQueries({ queryKey: ['dex', 'markets'] })
    },
    onError: (error: Error) => {
      console.error('[executeMarketOrder] Failed:', error)
      toast.error(`Trade failed: ${error.message}`)
    },
  })

  // ============ MUTATION: Cancel Order ============
  const cancelOrder = useMutation({
    mutationKey: ['dex', 'cancelOrder'],
    mutationFn: async (orderId: number) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      const signature = await program.methods
        .cancelOrder(orderId)
        .accounts({
          authority: wallet.publicKey,
        })
        .rpc()

      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Order cancelled')
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
    },
    onError: (error: Error) => {
      toast.error(`Cancel failed: ${error.message}`)
    },
  })

  // ============ MUTATION: Close Position ============
  const closePosition = useMutation({
    mutationKey: ['dex', 'closePosition'],
    mutationFn: async (marketIndex: number) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      const signature = await program.methods
        .closePosition(marketIndex)
        .accounts({
          authority: wallet.publicKey,
        })
        .rpc()

      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Position closed')
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
      queryClient.invalidateQueries({ queryKey: ['dex', 'markets'] })
    },
    onError: (error: Error) => {
      toast.error(`Close position failed: ${error.message}`)
    },
  })

  // ============ DAY 3: MUTATION: Settle Position (for settled markets) ============
  const settlePosition = useMutation({
    mutationKey: ['dex', 'settlePosition'],
    mutationFn: async (marketIndex: number) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signature = await (program.methods as any)
        .settlePosition(marketIndex)
        .accounts({
          authority: wallet.publicKey,
        })
        .rpc()

      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Position settled! Funds returned to collateral.')
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
      queryClient.invalidateQueries({ queryKey: ['dex', 'markets'] })
    },
    onError: (error: Error) => {
      toast.error(`Settlement failed: ${error.message}`)
    },
  })

  // ============ DAY 3: MUTATION: Settle Funding ============
  const settleFunding = useMutation({
    mutationKey: ['dex', 'settleFunding'],
    mutationFn: async (marketIndex: number) => {
      if (!program || !wallet.publicKey) throw new Error('Not connected')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signature = await (program.methods as any)
        .settleFunding(marketIndex)
        .accounts({
          authority: wallet.publicKey,
        })
        .rpc()

      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Funding settled')
      queryClient.invalidateQueries({ queryKey: ['dex', 'user'] })
    },
    onError: (error: Error) => {
      toast.error(`Settle funding failed: ${error.message}`)
    },
  })

  return {
    program,
    programId,
    // Queries
    stateQuery,
    marketsQuery,
    userQuery,
    // Mutations
    initializeUser,
    deposit,
    withdraw,
    placeOrder,
    executeMarketOrder, // Atomic: Place + Fill + TP/SL in ONE tx
    cancelOrder,
    closePosition,
    // Day 3 Mutations
    settlePosition,
    settleFunding,
  }
}

// ============ HELPER HOOKS ============

/**
 * Hook to get selected market
 */
export function useSelectedMarket() {
  const [selectedIndex, setSelectedIndex] = useAtom(selectedMarketIndexAtom)
  const { marketsQuery } = useDexProgram()

  const selectedMarket = useMemo(() => {
    if (!marketsQuery.data) return null
    return marketsQuery.data.find((m) => m.info.marketIndex === selectedIndex)
  }, [marketsQuery.data, selectedIndex])

  return {
    selectedIndex,
    setSelectedIndex,
    selectedMarket,
    markets: marketsQuery.data,
    isLoading: marketsQuery.isLoading,
  }
}

/**
 * Hook to get user positions
 */
export function useUserPositions() {
  const { userQuery, marketsQuery } = useDexProgram()

  const positions = useMemo(() => {
    if (!userQuery.data || !marketsQuery.data) return []

    interface UserPosition {
      marketIndex: number
      baseAssetAmount: BN
      quoteEntryAmount: BN
      lastCumulativeFundingRate?: BN
    }
    interface UserOrder {
      orderId: number
      marketIndex: number
      orderType: Record<string, unknown>
      price: unknown
      triggerPrice: unknown
      status: Record<string, unknown>
      reduceOnly: boolean
    }
    const userData = userQuery.data as unknown as { 
      positions?: UserPosition[]
      orders?: UserOrder[]
      collateral?: unknown 
    }
    const userPositions = userData?.positions || []
    const userOrders = userData?.orders || []
    const userCollateral = toBN(userData?.collateral)

    return userPositions
      .filter((p) => {
        return !toBN(p.baseAssetAmount).isZero()
      })
      .map((p) => {
        const market = marketsQuery.data?.find((m) => m.info.marketIndex === p.marketIndex)
        const baseAmount = toBN(p.baseAssetAmount)
        const quoteEntry = toBN(p.quoteEntryAmount)
        const marketAccount = market?.account as { oraclePrice?: unknown; marginRatioMaintenance?: number } | undefined
        const oraclePrice = toBN(marketAccount?.oraclePrice)
        const marginRatioMaintenance = marketAccount?.marginRatioMaintenance || DEFAULT_MAINTENANCE_MARGIN_RATIO

        const direction = baseAmount.isNeg() ? PositionDirection.Short : PositionDirection.Long
        const size = baseAmount.abs()
        const entryPrice = quoteEntry.isZero() ? new BN(0) : quoteEntry.abs().mul(new BN(BASE_PRECISION)).div(size)

        // Calculate unrealized PnL
        const currentValue = size.mul(oraclePrice).div(new BN(PRICE_PRECISION))
        const entryValue = quoteEntry.abs()
        const unrealizedPnl = baseAmount.isNeg() ? entryValue.sub(currentValue) : currentValue.sub(entryValue)

        // Calculate liquidation price (client-side calculation)
        const liquidationPrice = calculateLiquidationPrice(
          baseAmount,
          quoteEntry,
          userCollateral,
          marginRatioMaintenance
        )

        // Day 3: Market settlement status
        const marketStatus = market?.info.status || MarketStatus.Active
        const isMarketSettled = marketStatus === MarketStatus.Settled
        const settlementPrice = market?.info.settlementPrice || new BN(0)

        // Find attached TP/SL orders for this position
        const tpOrder = userOrders.find(
          (o) =>
            o.marketIndex === p.marketIndex &&
            o.orderType.takeProfit &&
            parseOrderStatus(o.status) === OrderStatus.Open,
        )
        const slOrder = userOrders.find(
          (o) =>
            o.marketIndex === p.marketIndex && o.orderType.stopLoss && parseOrderStatus(o.status) === OrderStatus.Open,
        )

        return {
          marketIndex: p.marketIndex,
          marketName: market?.info.name || `Market ${p.marketIndex}`,
          direction,
          size,
          entryPrice,
          markPrice: oraclePrice,
          unrealizedPnl,
          liquidationPrice,
          // Day 3 fields
          marketStatus,
          isMarketSettled,
          settlementPrice,
          lastCumulativeFundingRate: p.lastCumulativeFundingRate
            ? toBN(p.lastCumulativeFundingRate)
            : new BN(0),
          // Attached TP/SL - use toBN to safely convert trigger prices
          takeProfitPrice: tpOrder ? toBN(tpOrder.triggerPrice) : null,
          takeProfitOrderId: tpOrder?.orderId ?? null,
          stopLossPrice: slOrder ? toBN(slOrder.triggerPrice) : null,
          stopLossOrderId: slOrder?.orderId ?? null,
        }
      })
  }, [userQuery.data, marketsQuery.data])

  return {
    positions,
    isLoading: userQuery.isLoading || marketsQuery.isLoading,
  }
}

/**
 * Hook to get user orders
 */
export function useUserOrders() {
  const { userQuery, marketsQuery } = useDexProgram()

  const orders = useMemo(() => {
    if (!userQuery.data || !marketsQuery.data) return []

    interface UserOrder {
      orderId: number
      marketIndex: number
      direction: { long?: object; short?: object }
      orderType: Record<string, unknown>
      baseAssetAmount: unknown
      price: unknown
      triggerPrice: unknown
      status: Record<string, unknown>
    }
    const userData = userQuery.data as unknown as { orders?: UserOrder[] }
    const userOrders = userData?.orders || []
    return userOrders
      .filter((o) => {
        const status = parseOrderStatus(o.status)
        return status === OrderStatus.Open
      })
      .map((o) => {
        const market = marketsQuery.data?.find((m) => m.info.marketIndex === o.marketIndex)
        const orderType = parseOrderType(o.orderType)
        // For TP/SL orders, use triggerPrice. For limit/market orders, use price.
        const isExitOrder = orderType === OrderType.TakeProfit || orderType === OrderType.StopLoss
        const displayPrice = isExitOrder ? toBN(o.triggerPrice) : toBN(o.price)
        
        return {
          orderId: o.orderId,
          marketIndex: o.marketIndex,
          marketName: market?.info.name || `Market ${o.marketIndex}`,
          direction: o.direction.long ? PositionDirection.Long : PositionDirection.Short,
          orderType,
          size: toBN(o.baseAssetAmount),
          price: displayPrice,
          status: parseOrderStatus(o.status),
        }
      })
  }, [userQuery.data, marketsQuery.data])

  return {
    orders,
    isLoading: userQuery.isLoading || marketsQuery.isLoading,
  }
}

/**
 * Hook to get user collateral info
 * Free collateral = Total deposited collateral - Margin used
 * NOTE: Unrealized P&L is NOT included in withdrawable amount (trades not closed yet)
 */
export function useUserCollateral() {
  const { userQuery, marketsQuery } = useDexProgram()

  const collateral = useMemo(() => {
    if (!userQuery.data) return null
    const user = userQuery.data as unknown as {
      collateral?: BN
      positions?: Array<{
        marketIndex: number
        baseAssetAmount: BN
        quoteEntryAmount: BN
      }>
    }
    const collateralAmount = user?.collateral ? new BN(user.collateral.toString()) : new BN(0)

    // Calculate unrealized P&L and margin used
    let totalUnrealizedPnl = new BN(0)
    let totalMarginUsed = new BN(0)

    const positions = user?.positions || []
    const markets = marketsQuery.data || []

    for (const position of positions) {
      const baseAmount = new BN(position.baseAssetAmount?.toString() || '0')
      if (baseAmount.isZero()) continue

      const market = markets.find((m) => m.info.marketIndex === position.marketIndex)
      if (!market) continue

      const oraclePrice = new BN(market.info.oraclePrice.toString())
      const quoteEntry = new BN(position.quoteEntryAmount?.toString() || '0')

      // Position value = |base| * price / PRICE_PRECISION
      const positionValue = baseAmount.abs().mul(oraclePrice).div(new BN(PRICE_PRECISION))

      // Calculate unrealized P&L (for display only, not withdrawable)
      const currentValue = positionValue
      const entryValue = quoteEntry.abs()

      if (baseAmount.isNeg()) {
        // Short: P&L = entry - current
        totalUnrealizedPnl = totalUnrealizedPnl.add(entryValue.sub(currentValue))
      } else {
        // Long: P&L = current - entry
        totalUnrealizedPnl = totalUnrealizedPnl.add(currentValue.sub(entryValue))
      }

      // Margin used = quote entry value * margin ratio (2%)
      // Using quote entry (position cost) rather than current value for stability
      const marginUsed = entryValue.mul(new BN(200)).div(new BN(10000)) // 2% initial margin
      totalMarginUsed = totalMarginUsed.add(marginUsed)
    }

    // Free collateral = deposited collateral - margin used
    // NOTE: Unrealized P&L is NOT included - only realized profits are withdrawable
    const freeCollateral = collateralAmount.sub(totalMarginUsed)

    // Equity = deposited + unrealized P&L (for display purposes only)
    const equity = collateralAmount.add(totalUnrealizedPnl)

    return {
      total: collateralAmount, // What user deposited
      equity: equity, // Total + Unrealized P&L (display only)
      free: freeCollateral.isNeg() ? new BN(0) : freeCollateral, // Actually withdrawable
      marginUsed: totalMarginUsed, // Locked for positions
      unrealizedPnl: totalUnrealizedPnl, // Display only, not withdrawable
    }
  }, [userQuery.data, marketsQuery.data])

  return {
    collateral,
    isLoading: userQuery.isLoading || marketsQuery.isLoading,
    exists: !!userQuery.data,
  }
}

// ============ HELPER FUNCTIONS ============

interface MarketAccount {
  marketIndex: number
  name: number[]
  status: Record<string, unknown>
  oraclePrice: BN
  amm: Record<string, unknown>
  baseAssetAmountLong: BN
  baseAssetAmountShort: BN
  // Day 3 fields
  settlementPrice?: BN
  lastFundingRate?: BN
  lastFundingRateTs?: BN
  fundingPeriod?: BN
  cumulativeFundingRateLong?: BN
  cumulativeFundingRateShort?: BN
}

function parseMarketInfo(account: Record<string, unknown>): DexMarketInfo {
  const typedAccount = account as unknown as MarketAccount
  return {
    marketIndex: typedAccount.marketIndex,
    name: bytesToString(typedAccount.name),
    status: parseMarketStatus(typedAccount.status),
    oraclePrice: new BN(typedAccount.oraclePrice.toString()),
    bidPrice: calculateBidPrice(typedAccount.amm),
    askPrice: calculateAskPrice(typedAccount.amm),
    openInterestLong: new BN(typedAccount.baseAssetAmountLong.toString()),
    openInterestShort: new BN(typedAccount.baseAssetAmountShort.toString()),
    // Day 3 fields
    settlementPrice: typedAccount.settlementPrice ? new BN(typedAccount.settlementPrice.toString()) : new BN(0),
    lastFundingRate: typedAccount.lastFundingRate ? new BN(typedAccount.lastFundingRate.toString()) : new BN(0),
    lastFundingRateTs: typedAccount.lastFundingRateTs ? new BN(typedAccount.lastFundingRateTs.toString()) : new BN(0),
    fundingPeriod: typedAccount.fundingPeriod ? new BN(typedAccount.fundingPeriod.toString()) : new BN(3600),
    cumulativeFundingRateLong: typedAccount.cumulativeFundingRateLong
      ? new BN(typedAccount.cumulativeFundingRateLong.toString())
      : new BN(0),
    cumulativeFundingRateShort: typedAccount.cumulativeFundingRateShort
      ? new BN(typedAccount.cumulativeFundingRateShort.toString())
      : new BN(0),
  }
}

function parseMarketStatus(status: Record<string, unknown>): MarketStatus {
  if (status.active) return MarketStatus.Active
  if (status.paused) return MarketStatus.Paused
  if (status.settled) return MarketStatus.Settled
  return MarketStatus.Uninitialized
}

function parseOrderStatus(status: Record<string, unknown>): OrderStatus {
  if (status.open) return OrderStatus.Open
  if (status.filled) return OrderStatus.Filled
  if (status.cancelled) return OrderStatus.Cancelled
  return OrderStatus.Init
}

function parseOrderType(orderType: Record<string, unknown>): OrderType {
  if (orderType.market) return OrderType.Market
  if (orderType.limit) return OrderType.Limit
  if (orderType.stopLoss) return OrderType.StopLoss
  if (orderType.takeProfit) return OrderType.TakeProfit
  return OrderType.Market
}

// ============ MARGIN CALCULATION HELPERS ============

/**
 * Calculate entry price from quote and base amounts
 */
function calculateEntryPrice(quoteEntryAmount: BN, baseAssetAmount: BN): BN {
  if (baseAssetAmount.isZero()) return new BN(0)
  return quoteEntryAmount.abs().mul(new BN(BASE_PRECISION)).div(baseAssetAmount.abs())
}

/**
 * Calculate margin requirement for a position value
 */
function calculateMarginRequirement(positionValue: BN, marginRatio: number): BN {
  return positionValue.mul(new BN(marginRatio)).div(new BN(MARGIN_PRECISION))
}

/**
 * Calculate liquidation price for a position
 */
function calculateLiquidationPrice(
  baseAssetAmount: BN,
  quoteEntryAmount: BN,
  collateral: BN,
  marginRatioMaintenance: number = DEFAULT_MAINTENANCE_MARGIN_RATIO
): BN {
  if (baseAssetAmount.isZero()) {
    return new BN(0)
  }

  const entryPrice = calculateEntryPrice(quoteEntryAmount, baseAssetAmount)
  const baseAbs = baseAssetAmount.abs()
  const positionValue = baseAbs.mul(entryPrice).div(new BN(BASE_PRECISION))
  const maintenanceMargin = calculateMarginRequirement(positionValue, marginRatioMaintenance)

  // Buffer = collateral - maintenance_margin
  const buffer = collateral.gt(maintenanceMargin) ? collateral.sub(maintenanceMargin) : new BN(0)

  // Price buffer = buffer * BASE_PRECISION / base_abs
  const priceBuffer = buffer.mul(new BN(BASE_PRECISION)).div(baseAbs)

  if (baseAssetAmount.gt(new BN(0))) {
    // Long: liquidate when price drops
    return entryPrice.gt(priceBuffer) ? entryPrice.sub(priceBuffer) : new BN(0)
  } else {
    // Short: liquidate when price rises
    const liqPrice = entryPrice.add(priceBuffer)
    return liqPrice.gt(new BN(MAX_PREDICTION_PRICE)) ? new BN(MAX_PREDICTION_PRICE) : liqPrice
  }
}

/**
 * Safely convert a value to BN, handling various input types
 */
function toBN(value: unknown): BN {
  if (value === null || value === undefined) return new BN(0)
  if (BN.isBN(value)) return value
  if (typeof value === 'number') return new BN(value)
  if (typeof value === 'string') return new BN(value)
  if (typeof value === 'object' && 'toString' in (value as object)) {
    return new BN((value as { toString: () => string }).toString())
  }
  return new BN(0)
}

type AnchorOrderType =
  | { market: Record<string, never> }
  | { limit: Record<string, never> }
  | { stopLoss: Record<string, never> }
  | { takeProfit: Record<string, never> }

function toAnchorOrderType(orderType: OrderType): AnchorOrderType {
  switch (orderType) {
    case OrderType.Market:
      return { market: {} }
    case OrderType.Limit:
      return { limit: {} }
    case OrderType.StopLoss:
      return { stopLoss: {} }
    case OrderType.TakeProfit:
      return { takeProfit: {} }
    default:
      return { market: {} }
  }
}

interface AmmData {
  baseAssetReserve: BN
  quoteAssetReserve: BN
  pegMultiplier: BN
  baseSpread?: number
}

function calculateBidPrice(amm: Record<string, unknown> | null): BN {
  if (!amm) return new BN(0)
  const typedAmm = amm as unknown as AmmData
  const baseReserve = new BN(typedAmm.baseAssetReserve.toString())
  const quoteReserve = new BN(typedAmm.quoteAssetReserve.toString())
  const pegMultiplier = new BN(typedAmm.pegMultiplier.toString())
  const baseSpread = typedAmm.baseSpread || 0

  if (baseReserve.isZero()) return new BN(0)

  const midPrice = quoteReserve.mul(pegMultiplier).mul(new BN(PRICE_PRECISION)).div(baseReserve).div(new BN(1_000_000)) // peg precision

  const spreadDeduction = midPrice.mul(new BN(baseSpread)).div(new BN(1_000_000))
  return midPrice.sub(spreadDeduction)
}

function calculateAskPrice(amm: Record<string, unknown> | null): BN {
  if (!amm) return new BN(0)
  const typedAmm = amm as unknown as AmmData
  const baseReserve = new BN(typedAmm.baseAssetReserve.toString())
  const quoteReserve = new BN(typedAmm.quoteAssetReserve.toString())
  const pegMultiplier = new BN(typedAmm.pegMultiplier.toString())
  const baseSpread = typedAmm.baseSpread || 0

  if (baseReserve.isZero()) return new BN(0)

  const midPrice = quoteReserve.mul(pegMultiplier).mul(new BN(PRICE_PRECISION)).div(baseReserve).div(new BN(1_000_000)) // peg precision

  const spreadAddition = midPrice.mul(new BN(baseSpread)).div(new BN(1_000_000))
  return midPrice.add(spreadAddition)
}
