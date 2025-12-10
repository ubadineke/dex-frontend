# Frontend Implementation Plan - Prediction Perp DEX

## Overview

Build a Drift-inspired trading interface for the Prediction Perpetual DEX on Solana. The frontend will integrate with the existing pred-perp-dex SDK to provide a complete trading experience.

---

## Design System

### Color Palette (Drift-inspired Dark Theme)

```css
/* Primary Background */
--bg-primary: #0a0e17;      /* Deep navy */
--bg-secondary: #111827;    /* Card backgrounds */
--bg-tertiary: #1a2332;     /* Input backgrounds */

/* Trading Colors */
--long: #10b981;            /* Emerald green for longs/YES */
--long-muted: #065f46;      /* Muted green */
--short: #ef4444;           /* Red for shorts/NO */
--short-muted: #7f1d1d;     /* Muted red */

/* Accent */
--accent: #06b6d4;          /* Cyan accent */
--accent-muted: #0e7490;    /* Muted cyan */

/* Text */
--text-primary: #f9fafb;    /* White text */
--text-secondary: #9ca3af;  /* Gray text */
--text-muted: #6b7280;      /* Muted text */

/* Borders */
--border: #1f2937;          /* Subtle borders */
--border-hover: #374151;    /* Hover borders */
```

### Typography

- **Font Family**: JetBrains Mono for numbers, Inter for UI text
- **Monospace Numbers**: All prices, sizes, PnL use monospace

---

## Component Architecture

### Layout Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                 │
│  [Logo] [Markets] [Trade] [Portfolio]     [Wallet] [Network] [Theme]   │
├─────────────────────────────────────┬──────────────────────────────────┤
│                                     │                                   │
│           MARKET INFO               │         ORDER FORM                │
│   Question + Price + 24h Stats      │   Direction Toggle + Size +       │
│                                     │   Leverage + Submit               │
├─────────────────────────────────────┼──────────────────────────────────┤
│                                     │                                   │
│         PRICE CHART                 │       ACCOUNT SUMMARY             │
│    (Simplified price history)       │   Collateral + PnL + Margin      │
│                                     │                                   │
├─────────────────────────────────────┴──────────────────────────────────┤
│                                                                         │
│                      POSITIONS / ORDERS TABS                            │
│    [Positions] [Open Orders] [Order History]                           │
│                                                                         │
│    Table showing active positions and orders with actions              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Day 1)

#### 1.1 SDK Integration
- [ ] Copy IDL and types from pred-perp-dex/sdk
- [ ] Create program hook using the SDK pattern
- [ ] Set up PredictionClient with wallet adapter

#### 1.2 Global State Management
- [ ] Protocol state atom (from getState)
- [ ] Markets atom (from getMarkets)
- [ ] User account atom (from getUser)
- [ ] Selected market atom

#### 1.3 Theme & Styling
- [ ] Update globals.css with trading-focused dark theme
- [ ] Add custom CSS variables for trading colors
- [ ] Configure JetBrains Mono font for numbers

---

### Phase 2: Core Components (Day 1-2)

#### 2.1 Market Selector
- [ ] Dropdown showing all available prediction markets
- [ ] Display: Market name, YES price, 24h change
- [ ] Visual indicator for selected market

#### 2.2 Market Info Panel
- [ ] Prediction question display
- [ ] Current YES/NO prices (bid/ask)
- [ ] Open interest (long/short)
- [ ] Market status indicator

#### 2.3 Order Form
Components:
- [ ] Direction toggle (LONG/YES vs SHORT/NO)
- [ ] Order type tabs (Market / Limit)
- [ ] Size input with USD/token toggle
- [ ] Leverage slider (1x - 50x)
- [ ] Order summary (Entry price, Liq price, Fees)
- [ ] Submit button with loading state

#### 2.4 Account Summary Panel
- [ ] Total collateral (SOL)
- [ ] Unrealized PnL (color-coded)
- [ ] Free collateral
- [ ] Current leverage
- [ ] Deposit/Withdraw buttons

#### 2.5 Positions Table
Columns:
- [ ] Market name
- [ ] Side (Long/Short with color)
- [ ] Size
- [ ] Entry price
- [ ] Mark price
- [ ] PnL ($ and %)
- [ ] Liquidation price
- [ ] Actions (Close, TP/SL)

#### 2.6 Orders Table
Columns:
- [ ] Market name
- [ ] Side
- [ ] Type (Market/Limit)
- [ ] Size
- [ ] Price
- [ ] Status
- [ ] Actions (Cancel)

---

### Phase 3: Trading Flow (Day 2)

#### 3.1 User Onboarding
- [ ] Initialize user account flow
- [ ] First deposit prompt
- [ ] Account setup wizard

#### 3.2 Deposit/Withdraw Modal
- [ ] Amount input with max button
- [ ] Balance display
- [ ] Transaction confirmation
- [ ] Success/error states

#### 3.3 Place Order Flow
- [ ] Form validation
- [ ] Slippage warning for large orders
- [ ] Transaction building
- [ ] Loading state
- [ ] Success/error toasts

#### 3.4 Close Position Flow
- [ ] Confirmation modal
- [ ] PnL preview
- [ ] Transaction submission

#### 3.5 Cancel Order Flow
- [ ] Confirmation prompt
- [ ] Transaction submission

---

### Phase 4: Real-time Updates (Day 2)

#### 4.1 Account Subscriptions
- [ ] Subscribe to user account changes
- [ ] Auto-refresh positions
- [ ] Auto-refresh orders

#### 4.2 Market Subscriptions
- [ ] Subscribe to market account changes
- [ ] Update prices in real-time
- [ ] Update open interest

#### 4.3 Transaction Notifications
- [ ] Transaction pending toast
- [ ] Transaction confirmed toast
- [ ] Transaction failed toast with error

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Redirect to /trade
│   ├── trade/
│   │   └── page.tsx                # Main trading page
│   ├── portfolio/
│   │   └── page.tsx                # User portfolio
│   ├── markets/
│   │   └── page.tsx                # Markets list
│   └── layout.tsx                  # Updated layout with new nav
│
├── components/
│   ├── dex/                        # DEX-specific components
│   │   ├── dex-data-access.tsx     # Program hooks & state
│   │   ├── market-selector.tsx     # Market dropdown
│   │   ├── market-info.tsx         # Market info panel
│   │   ├── order-form.tsx          # Trading form
│   │   ├── account-panel.tsx       # Account summary
│   │   ├── positions-table.tsx     # Positions list
│   │   ├── orders-table.tsx        # Orders list
│   │   ├── deposit-modal.tsx       # Deposit dialog
│   │   ├── withdraw-modal.tsx      # Withdraw dialog
│   │   └── trade-feature.tsx       # Main trade layout
│   │
│   ├── ui/                         # shadcn/ui components
│   │   ├── tabs.tsx                # Add tabs component
│   │   ├── slider.tsx              # Add slider for leverage
│   │   ├── badge.tsx               # Add badge component
│   │   ├── skeleton.tsx            # Add skeleton loader
│   │   └── ... (existing)
│   │
│   └── ... (existing components)
│
├── lib/
│   ├── utils.ts                    # Existing utils
│   ├── format.ts                   # Number/price formatting
│   └── constants.ts                # DEX constants
│
└── idl/                            # Program IDL
    ├── pred_perp_dex.json
    └── pred_perp_dex.ts
```

---

## Key Features

### 1. Wallet-First UX
- Prominent connect wallet button
- Auto-detect user account
- Guide new users through account creation

### 2. Mobile Responsive
- Collapsible panels on mobile
- Bottom sheet order form
- Swipe tabs for positions/orders

### 3. Keyboard Shortcuts
- `B` - Quick buy/long
- `S` - Quick sell/short
- `Esc` - Cancel action
- `Enter` - Submit order

### 4. Error Handling
- Clear error messages
- Transaction simulation preview
- Insufficient balance warnings
- Slippage protection alerts

---

## SDK Integration Points

### Queries (React Query)
```typescript
// State query
useQuery(['state'], () => client.getState())

// Markets query
useQuery(['markets'], () => client.getAllMarketInfos())

// User query
useQuery(['user', publicKey], () => client.getUser(publicKey))

// Position info
useQuery(['position', marketIndex], () => client.getPositionInfo(marketIndex))
```

### Mutations (React Query)
```typescript
// Initialize user
useMutation(() => client.initializeUser())

// Deposit
useMutation((amount) => client.deposit(amount))

// Withdraw
useMutation((amount) => client.withdraw(amount))

// Place order
useMutation((params) => client.placeOrder(params))

// Cancel order
useMutation((orderId) => client.cancelOrder(orderId))

// Close position
useMutation((marketIndex) => client.closePosition(marketIndex))
```

---

## Implementation Order

### Day 1 (Core)
1. SDK integration + data access hooks
2. Theme update with trading colors
3. Layout restructure with trading nav
4. Market selector + market info panel
5. Account summary panel
6. Deposit/Withdraw modals

### Day 2 (Trading)
1. Order form with full functionality
2. Positions table with actions
3. Orders table with cancel
4. Real-time subscriptions
5. Transaction toasts
6. Polish and testing

---

## Testing Checklist

### Unit Tests
- [ ] Format utilities (prices, sizes, PnL)
- [ ] Calculation helpers (leverage, margin)

### Integration Tests
- [ ] Connect wallet flow
- [ ] Initialize user flow
- [ ] Deposit/withdraw flow
- [ ] Place order flow
- [ ] Cancel order flow
- [ ] Close position flow

### E2E Tests
- [ ] Full trading cycle (deposit → trade → close → withdraw)
- [ ] Multiple markets
- [ ] Error scenarios

---

## Notes

- Use `BN` from `@coral-xyz/anchor` for all numeric values
- All prices are in 6 decimal precision (1e6 = 1.00)
- Collateral amounts are in lamports (1e9 = 1 SOL)
- Market names are stored as byte arrays, use `bytesToString()` helper


