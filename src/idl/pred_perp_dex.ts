/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pred_perp_dex.json`.
 */
export type PredPerpDex = {
  "address": "8NgM6fAspbaUv1W2pAkowdo8R9p9eYkoXPUq3DbH5Yf9",
  "metadata": {
    "name": "predPerpDex",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Prediction Market Perpetual DEX - MVP"
  },
  "instructions": [
    {
      "name": "addMarket",
      "docs": [
        "Add a new prediction market"
      ],
      "discriminator": [
        41,
        137,
        185,
        126,
        69,
        139,
        254,
        55
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "state.number_of_markets",
                "account": "state"
              }
            ]
          }
        },
        {
          "name": "oracle"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "addMarketParams"
            }
          }
        }
      ]
    },
    {
      "name": "cancelOrder",
      "docs": [
        "Cancel an open order"
      ],
      "discriminator": [
        95,
        129,
        237,
        240,
        8,
        49,
        223,
        132
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "u32"
        }
      ]
    },
    {
      "name": "closePosition",
      "docs": [
        "Close an entire position (market order)"
      ],
      "discriminator": [
        123,
        134,
        81,
        0,
        49,
        68,
        98,
        98
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "state",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketIndex"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "marketIndex",
          "type": "u16"
        }
      ]
    },
    {
      "name": "deposit",
      "docs": [
        "Deposit SOL collateral"
      ],
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "state",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fillOrder",
      "docs": [
        "Fill an order against the AMM (keeper instruction)"
      ],
      "discriminator": [
        232,
        122,
        115,
        25,
        199,
        143,
        136,
        162
      ],
      "accounts": [
        {
          "name": "filler",
          "docs": [
            "Keeper or authority that can fill orders"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "docs": [
            "User whose order is being filled"
          ],
          "writable": true
        },
        {
          "name": "state",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "u32"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the protocol"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeUser",
      "docs": [
        "Initialize a user account"
      ],
      "discriminator": [
        111,
        17,
        185,
        250,
        60,
        122,
        38,
        254
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "state",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "placeOrder",
      "docs": [
        "Place a new order"
      ],
      "discriminator": [
        51,
        194,
        155,
        175,
        109,
        130,
        96,
        106
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "state",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "params.market_index"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "orderParams"
            }
          }
        }
      ]
    },
    {
      "name": "setPaused",
      "docs": [
        "Pause or unpause the exchange"
      ],
      "discriminator": [
        91,
        60,
        125,
        192,
        176,
        225,
        166,
        218
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateOracle",
      "docs": [
        "Update oracle price for a market (keeper instruction)"
      ],
      "discriminator": [
        112,
        41,
        209,
        18,
        248,
        226,
        252,
        188
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Oracle authority (keeper)"
          ],
          "signer": true
        },
        {
          "name": "state",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketIndex"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "marketIndex",
          "type": "u16"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "twap",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw SOL collateral"
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "state",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "predictionMarket",
      "discriminator": [
        117,
        150,
        97,
        152,
        119,
        58,
        51,
        58
      ]
    },
    {
      "name": "state",
      "discriminator": [
        216,
        146,
        107,
        94,
        104,
        75,
        182,
        177
      ]
    },
    {
      "name": "user",
      "discriminator": [
        159,
        117,
        95,
        227,
        239,
        151,
        58,
        236
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "mathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6001,
      "name": "mathUnderflow",
      "msg": "Math underflow"
    },
    {
      "code": 6002,
      "name": "divisionByZero",
      "msg": "Division by zero"
    },
    {
      "code": 6003,
      "name": "invalidPrecision",
      "msg": "Invalid precision"
    },
    {
      "code": 6004,
      "name": "exchangePaused",
      "msg": "Exchange is paused"
    },
    {
      "code": 6005,
      "name": "invalidAdmin",
      "msg": "Invalid admin"
    },
    {
      "code": 6006,
      "name": "invalidAuthority",
      "msg": "Invalid authority"
    },
    {
      "code": 6007,
      "name": "stateAlreadyInitialized",
      "msg": "State already initialized"
    },
    {
      "code": 6008,
      "name": "invalidMarketIndex",
      "msg": "Invalid market index"
    },
    {
      "code": 6009,
      "name": "marketNotActive",
      "msg": "Market not active"
    },
    {
      "code": 6010,
      "name": "marketAlreadySettled",
      "msg": "Market already settled"
    },
    {
      "code": 6011,
      "name": "marketNotFound",
      "msg": "Market not found"
    },
    {
      "code": 6012,
      "name": "maxMarketsReached",
      "msg": "Max markets reached"
    },
    {
      "code": 6013,
      "name": "invalidMarketStatus",
      "msg": "Invalid market status"
    },
    {
      "code": 6014,
      "name": "userAlreadyInitialized",
      "msg": "User account already initialized"
    },
    {
      "code": 6015,
      "name": "userNotInitialized",
      "msg": "User not initialized"
    },
    {
      "code": 6016,
      "name": "insufficientCollateral",
      "msg": "Insufficient collateral"
    },
    {
      "code": 6017,
      "name": "collateralBelowMinimum",
      "msg": "Collateral below minimum"
    },
    {
      "code": 6018,
      "name": "withdrawalExceedsFreeCollateral",
      "msg": "Withdrawal exceeds free collateral"
    },
    {
      "code": 6019,
      "name": "userBeingLiquidated",
      "msg": "User is being liquidated"
    },
    {
      "code": 6020,
      "name": "userBankrupt",
      "msg": "User is bankrupt"
    },
    {
      "code": 6021,
      "name": "positionNotFound",
      "msg": "Position not found"
    },
    {
      "code": 6022,
      "name": "maxPositionsReached",
      "msg": "Max positions reached"
    },
    {
      "code": 6023,
      "name": "invalidPositionDirection",
      "msg": "Invalid position direction"
    },
    {
      "code": 6024,
      "name": "positionStillOpen",
      "msg": "Position still open"
    },
    {
      "code": 6025,
      "name": "invalidOrderType",
      "msg": "Invalid order type"
    },
    {
      "code": 6026,
      "name": "invalidOrderDirection",
      "msg": "Invalid order direction"
    },
    {
      "code": 6027,
      "name": "orderNotFound",
      "msg": "Order not found"
    },
    {
      "code": 6028,
      "name": "maxOrdersReached",
      "msg": "Max orders reached"
    },
    {
      "code": 6029,
      "name": "orderAlreadyFilled",
      "msg": "Order already filled"
    },
    {
      "code": 6030,
      "name": "orderAlreadyCancelled",
      "msg": "Order already cancelled"
    },
    {
      "code": 6031,
      "name": "orderExpired",
      "msg": "Order expired"
    },
    {
      "code": 6032,
      "name": "orderSizeTooSmall",
      "msg": "Order size too small"
    },
    {
      "code": 6033,
      "name": "orderPriceOutsideBounds",
      "msg": "Order price outside bounds"
    },
    {
      "code": 6034,
      "name": "orderExceedsMaxLeverage",
      "msg": "Order would exceed max leverage"
    },
    {
      "code": 6035,
      "name": "reduceOnlyOrderIncreasesPosition",
      "msg": "Reduce only order would increase position"
    },
    {
      "code": 6036,
      "name": "insufficientAmmLiquidity",
      "msg": "Insufficient AMM liquidity"
    },
    {
      "code": 6037,
      "name": "tradeSizeTooLarge",
      "msg": "Trade size too large for AMM"
    },
    {
      "code": 6038,
      "name": "priceBoundsExceeded",
      "msg": "Price bounds exceeded"
    },
    {
      "code": 6039,
      "name": "invalidAmmReserves",
      "msg": "Invalid AMM reserves"
    },
    {
      "code": 6040,
      "name": "slippageToleranceExceeded",
      "msg": "Slippage tolerance exceeded"
    },
    {
      "code": 6041,
      "name": "invalidOracle",
      "msg": "Invalid oracle"
    },
    {
      "code": 6042,
      "name": "oraclePriceStale",
      "msg": "Oracle price stale"
    },
    {
      "code": 6043,
      "name": "oraclePriceInvalid",
      "msg": "Oracle price invalid"
    },
    {
      "code": 6044,
      "name": "oracleConfidenceTooWide",
      "msg": "Oracle confidence too wide"
    },
    {
      "code": 6045,
      "name": "insufficientMargin",
      "msg": "Insufficient margin"
    },
    {
      "code": 6046,
      "name": "leverageExceedsMax",
      "msg": "Leverage exceeds maximum"
    },
    {
      "code": 6047,
      "name": "sufficientCollateral",
      "msg": "User has sufficient collateral"
    },
    {
      "code": 6048,
      "name": "liquidationNotRequired",
      "msg": "Liquidation not required"
    },
    {
      "code": 6049,
      "name": "invalidLiquidationAmount",
      "msg": "Invalid liquidation amount"
    },
    {
      "code": 6050,
      "name": "fundingNotReady",
      "msg": "Funding not ready"
    },
    {
      "code": 6051,
      "name": "invalidFundingPeriod",
      "msg": "Invalid funding period"
    },
    {
      "code": 6052,
      "name": "marketNotExpired",
      "msg": "Market not expired"
    },
    {
      "code": 6053,
      "name": "invalidSettlementPrice",
      "msg": "Invalid settlement price"
    },
    {
      "code": 6054,
      "name": "positionNotSettled",
      "msg": "Position not settled"
    }
  ],
  "types": [
    {
      "name": "amm",
      "docs": [
        "AMM state embedded in PredictionMarket",
        "Uses zero_copy for efficient on-chain access"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baseAssetReserve",
            "docs": [
              "Base asset reserves (x in x*y=k)",
              "precision: AMM_RESERVE_PRECISION (1e9)"
            ],
            "type": "u128"
          },
          {
            "name": "quoteAssetReserve",
            "docs": [
              "Quote asset reserves (y in x*y=k)",
              "precision: AMM_RESERVE_PRECISION (1e9)"
            ],
            "type": "u128"
          },
          {
            "name": "sqrtK",
            "docs": [
              "sqrt(k) - stored for efficient calculation",
              "precision: AMM_RESERVE_PRECISION"
            ],
            "type": "u128"
          },
          {
            "name": "pegMultiplier",
            "docs": [
              "Peg multiplier - scales reserves to real price",
              "For prediction markets: typically 1_000_000 (PRICE_PRECISION)",
              "price = (quote_reserve * peg) / base_reserve"
            ],
            "type": "u128"
          },
          {
            "name": "minBaseAssetReserve",
            "docs": [
              "Minimum base reserves (limits how high price can go)",
              "Corresponds to MAX_PREDICTION_PRICE ($0.95)"
            ],
            "type": "u128"
          },
          {
            "name": "maxBaseAssetReserve",
            "docs": [
              "Maximum base reserves (limits how low price can go)",
              "Corresponds to MIN_PREDICTION_PRICE ($0.05)"
            ],
            "type": "u128"
          },
          {
            "name": "terminalQuoteAssetReserve",
            "docs": [
              "Terminal quote reserves when AMM position is 0"
            ],
            "type": "u128"
          },
          {
            "name": "baseAssetAmountWithAmm",
            "docs": [
              "Net position: positive = AMM is short (users net long)",
              "precision: BASE_PRECISION"
            ],
            "type": "i128"
          },
          {
            "name": "baseAssetAmountLong",
            "docs": [
              "Total long open interest"
            ],
            "type": "i128"
          },
          {
            "name": "baseAssetAmountShort",
            "docs": [
              "Total short open interest (stored as positive)"
            ],
            "type": "i128"
          },
          {
            "name": "baseSpread",
            "docs": [
              "Base spread in basis points (e.g., 1000 = 0.1%)",
              "Half applied to each side"
            ],
            "type": "u32"
          },
          {
            "name": "maxSpread",
            "docs": [
              "Maximum spread allowed"
            ],
            "type": "u32"
          },
          {
            "name": "longSpread",
            "docs": [
              "Current long spread (ask side)"
            ],
            "type": "u32"
          },
          {
            "name": "shortSpread",
            "docs": [
              "Current short spread (bid side)"
            ],
            "type": "u32"
          },
          {
            "name": "lastMarkPriceTwap",
            "docs": [
              "Last computed mark price TWAP (1 hour)"
            ],
            "type": "u64"
          },
          {
            "name": "lastMarkPriceTwap5min",
            "docs": [
              "Last computed mark price TWAP (5 min)"
            ],
            "type": "u64"
          },
          {
            "name": "lastMarkPriceTwapTs",
            "docs": [
              "Timestamp of last TWAP update"
            ],
            "type": "i64"
          },
          {
            "name": "lastBidPriceTwap",
            "docs": [
              "Last bid price for TWAP"
            ],
            "type": "u64"
          },
          {
            "name": "lastAskPriceTwap",
            "docs": [
              "Last ask price for TWAP"
            ],
            "type": "u64"
          },
          {
            "name": "totalFee",
            "docs": [
              "Total fees collected by AMM"
            ],
            "type": "i128"
          },
          {
            "name": "totalFeeMinusDistributions",
            "docs": [
              "Fees minus distributions (available for operations)"
            ],
            "type": "i128"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "addMarketParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "polymarketId",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "initialPrice",
            "type": "u64"
          },
          {
            "name": "expiryTs",
            "type": "i64"
          },
          {
            "name": "initialLiquidity",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "marketStatus",
      "docs": [
        "Market status"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "uninitialized"
          },
          {
            "name": "active"
          },
          {
            "name": "paused"
          },
          {
            "name": "settled"
          }
        ]
      }
    },
    {
      "name": "order",
      "docs": [
        "An order placed by a user"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "docs": [
              "Unique order ID (incrementing per user)"
            ],
            "type": "u32"
          },
          {
            "name": "marketIndex",
            "docs": [
              "Market index this order is for"
            ],
            "type": "u16"
          },
          {
            "name": "status",
            "docs": [
              "Current status of the order"
            ],
            "type": {
              "defined": {
                "name": "orderStatus"
              }
            }
          },
          {
            "name": "orderType",
            "docs": [
              "Type of order"
            ],
            "type": {
              "defined": {
                "name": "orderType"
              }
            }
          },
          {
            "name": "direction",
            "docs": [
              "Direction: Long (buy) or Short (sell)"
            ],
            "type": {
              "defined": {
                "name": "positionDirection"
              }
            }
          },
          {
            "name": "price",
            "docs": [
              "Limit price for limit orders (0 for market orders)",
              "precision: PRICE_PRECISION"
            ],
            "type": "u64"
          },
          {
            "name": "baseAssetAmount",
            "docs": [
              "Total base asset amount for this order",
              "precision: BASE_PRECISION"
            ],
            "type": "u64"
          },
          {
            "name": "baseAssetAmountFilled",
            "docs": [
              "Amount that has been filled so far",
              "precision: BASE_PRECISION"
            ],
            "type": "u64"
          },
          {
            "name": "triggerPrice",
            "docs": [
              "Trigger price for stop-loss/take-profit",
              "precision: PRICE_PRECISION"
            ],
            "type": "u64"
          },
          {
            "name": "triggerCondition",
            "docs": [
              "Condition for trigger orders"
            ],
            "type": {
              "defined": {
                "name": "triggerCondition"
              }
            }
          },
          {
            "name": "reduceOnly",
            "docs": [
              "If true, order can only reduce position"
            ],
            "type": "bool"
          },
          {
            "name": "postOnly",
            "docs": [
              "If true, order can only add to the book (no immediate fill)"
            ],
            "type": "bool"
          },
          {
            "name": "slot",
            "docs": [
              "Slot when order was placed"
            ],
            "type": "u64"
          },
          {
            "name": "maxTs",
            "docs": [
              "Maximum timestamp for order validity (0 = no expiry)"
            ],
            "type": "i64"
          },
          {
            "name": "padding",
            "docs": [
              "Padding for alignment"
            ],
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "orderParams",
      "docs": [
        "Parameters for placing an order"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketIndex",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "positionDirection"
              }
            }
          },
          {
            "name": "orderType",
            "type": {
              "defined": {
                "name": "orderType"
              }
            }
          },
          {
            "name": "baseAssetAmount",
            "type": "u64"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "triggerPrice",
            "type": "u64"
          },
          {
            "name": "triggerCondition",
            "type": {
              "defined": {
                "name": "triggerCondition"
              }
            }
          },
          {
            "name": "reduceOnly",
            "type": "bool"
          },
          {
            "name": "postOnly",
            "type": "bool"
          },
          {
            "name": "maxTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "orderStatus",
      "docs": [
        "Order status"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "init"
          },
          {
            "name": "open"
          },
          {
            "name": "filled"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "orderType",
      "docs": [
        "Order type"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "market"
          },
          {
            "name": "limit"
          },
          {
            "name": "stopLoss"
          },
          {
            "name": "takeProfit"
          }
        ]
      }
    },
    {
      "name": "perpPosition",
      "docs": [
        "Perpetual position for a specific market"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketIndex",
            "docs": [
              "Market index this position is for"
            ],
            "type": "u16"
          },
          {
            "name": "baseAssetAmount",
            "docs": [
              "Base asset amount (position size)",
              "Positive = long, Negative = short",
              "precision: BASE_PRECISION"
            ],
            "type": "i64"
          },
          {
            "name": "quoteAssetAmount",
            "docs": [
              "Quote asset amount (cost basis tracking)",
              "Used for realized P&L calculations",
              "precision: QUOTE_PRECISION"
            ],
            "type": "i64"
          },
          {
            "name": "quoteEntryAmount",
            "docs": [
              "Quote amount at entry (for unrealized P&L)",
              "precision: QUOTE_PRECISION"
            ],
            "type": "i64"
          },
          {
            "name": "lastCumulativeFundingRate",
            "docs": [
              "Last cumulative funding rate when position was updated",
              "Used to calculate funding payments"
            ],
            "type": "i64"
          },
          {
            "name": "openBids",
            "docs": [
              "Open bid exposure (from open long orders)",
              "precision: BASE_PRECISION"
            ],
            "type": "i64"
          },
          {
            "name": "openAsks",
            "docs": [
              "Open ask exposure (from open short orders)",
              "precision: BASE_PRECISION"
            ],
            "type": "i64"
          },
          {
            "name": "openOrders",
            "docs": [
              "Number of open orders for this market"
            ],
            "type": "u8"
          },
          {
            "name": "padding",
            "docs": [
              "Padding for alignment"
            ],
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          }
        ]
      }
    },
    {
      "name": "positionDirection",
      "docs": [
        "Direction of a position or order"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "long"
          },
          {
            "name": "short"
          }
        ]
      }
    },
    {
      "name": "predictionMarket",
      "docs": [
        "Prediction Market account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "docs": [
              "Public key of this account"
            ],
            "type": "pubkey"
          },
          {
            "name": "marketIndex",
            "docs": [
              "Market index (0-indexed, unique identifier)"
            ],
            "type": "u16"
          },
          {
            "name": "name",
            "docs": [
              "Human-readable name (e.g., \"TRUMP-WIN-2024\")"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "polymarketId",
            "docs": [
              "Polymarket condition ID for oracle reference"
            ],
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "oracle",
            "docs": [
              "Oracle account that provides price data"
            ],
            "type": "pubkey"
          },
          {
            "name": "oraclePrice",
            "docs": [
              "Current oracle price (YES price, 0-1_000_000)"
            ],
            "type": "u64"
          },
          {
            "name": "oracleTwap",
            "docs": [
              "Oracle TWAP (5-minute time-weighted average)"
            ],
            "type": "u64"
          },
          {
            "name": "lastOracleUpdate",
            "docs": [
              "Timestamp of last oracle update"
            ],
            "type": "i64"
          },
          {
            "name": "status",
            "docs": [
              "Current market status"
            ],
            "type": {
              "defined": {
                "name": "marketStatus"
              }
            }
          },
          {
            "name": "expiryTs",
            "docs": [
              "Timestamp when event expires/resolves"
            ],
            "type": "i64"
          },
          {
            "name": "settlementPrice",
            "docs": [
              "Final settlement price (0 or 1_000_000 for NO/YES)"
            ],
            "type": "u64"
          },
          {
            "name": "baseAssetAmountLong",
            "docs": [
              "Total long open interest (base asset)"
            ],
            "type": "i128"
          },
          {
            "name": "baseAssetAmountShort",
            "docs": [
              "Total short open interest (base asset)"
            ],
            "type": "i128"
          },
          {
            "name": "cumulativeFundingRateLong",
            "docs": [
              "Cumulative funding rate for longs"
            ],
            "type": "i128"
          },
          {
            "name": "cumulativeFundingRateShort",
            "docs": [
              "Cumulative funding rate for shorts"
            ],
            "type": "i128"
          },
          {
            "name": "lastFundingRate",
            "docs": [
              "Last funding rate applied"
            ],
            "type": "i64"
          },
          {
            "name": "lastFundingRateTs",
            "docs": [
              "Timestamp of last funding update"
            ],
            "type": "i64"
          },
          {
            "name": "fundingPeriod",
            "docs": [
              "Funding period in seconds (e.g., 3600 for 1 hour)"
            ],
            "type": "i64"
          },
          {
            "name": "takerFee",
            "docs": [
              "Taker fee in basis points (e.g., 50 = 0.05%)"
            ],
            "type": "u32"
          },
          {
            "name": "makerRebate",
            "docs": [
              "Maker rebate in basis points"
            ],
            "type": "u32"
          },
          {
            "name": "marginRatioInitial",
            "docs": [
              "Initial margin ratio (e.g., 200 = 2% = 50x leverage)"
            ],
            "type": "u32"
          },
          {
            "name": "marginRatioMaintenance",
            "docs": [
              "Maintenance margin ratio (e.g., 50 = 0.5% for liquidation)"
            ],
            "type": "u32"
          },
          {
            "name": "orderTickSize",
            "docs": [
              "Minimum tick size for orders"
            ],
            "type": "u64"
          },
          {
            "name": "minOrderSize",
            "docs": [
              "Minimum order size (base asset)"
            ],
            "type": "u64"
          },
          {
            "name": "amm",
            "docs": [
              "Embedded AMM for market making"
            ],
            "type": {
              "defined": {
                "name": "amm"
              }
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "padding",
            "docs": [
              "Padding for future expansion"
            ],
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "state",
      "docs": [
        "Global protocol state (singleton)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "Admin authority who can update protocol settings"
            ],
            "type": "pubkey"
          },
          {
            "name": "collateralVault",
            "docs": [
              "Collateral vault holding all user deposits"
            ],
            "type": "pubkey"
          },
          {
            "name": "collateralVaultBump",
            "docs": [
              "Bump seed for the collateral vault PDA"
            ],
            "type": "u8"
          },
          {
            "name": "numberOfMarkets",
            "docs": [
              "Number of markets created"
            ],
            "type": "u16"
          },
          {
            "name": "exchangePaused",
            "docs": [
              "Whether the entire exchange is paused"
            ],
            "type": "bool"
          },
          {
            "name": "minCollateral",
            "docs": [
              "Minimum collateral required (in lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "liquidationMarginRatio",
            "docs": [
              "Default liquidation margin ratio (for new markets)"
            ],
            "type": "u32"
          },
          {
            "name": "maxLeverage",
            "docs": [
              "Maximum leverage allowed"
            ],
            "type": "u32"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for this account"
            ],
            "type": "u8"
          },
          {
            "name": "padding",
            "docs": [
              "Padding for future expansion"
            ],
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "triggerCondition",
      "docs": [
        "Trigger condition for stop/take-profit orders"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "above"
          },
          {
            "name": "below"
          }
        ]
      }
    },
    {
      "name": "user",
      "docs": [
        "User account holding collateral, positions, and orders"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The wallet that owns this account"
            ],
            "type": "pubkey"
          },
          {
            "name": "delegate",
            "docs": [
              "Optional delegate who can trade on behalf of user"
            ],
            "type": "pubkey"
          },
          {
            "name": "name",
            "docs": [
              "User's name (optional identifier)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "collateral",
            "docs": [
              "Total collateral deposited (native SOL in lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "positions",
            "docs": [
              "User's perpetual positions (max 8 concurrent)"
            ],
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "perpPosition"
                  }
                },
                4
              ]
            }
          },
          {
            "name": "orders",
            "docs": [
              "User's open orders (max 32)"
            ],
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "order"
                  }
                },
                8
              ]
            }
          },
          {
            "name": "totalDeposits",
            "docs": [
              "Total deposits ever made"
            ],
            "type": "u64"
          },
          {
            "name": "totalWithdraws",
            "docs": [
              "Total withdrawals ever made"
            ],
            "type": "u64"
          },
          {
            "name": "realizedPnl",
            "docs": [
              "Cumulative realized P&L"
            ],
            "type": "i64"
          },
          {
            "name": "status",
            "docs": [
              "Current account status"
            ],
            "type": {
              "defined": {
                "name": "userStatus"
              }
            }
          },
          {
            "name": "openOrders",
            "docs": [
              "Number of open orders"
            ],
            "type": "u8"
          },
          {
            "name": "nextOrderId",
            "docs": [
              "Next order ID to assign"
            ],
            "type": "u32"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "padding",
            "docs": [
              "Padding for future expansion"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "userStatus",
      "docs": [
        "User account status"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "beingLiquidated"
          },
          {
            "name": "bankrupt"
          }
        ]
      }
    }
  ]
};
