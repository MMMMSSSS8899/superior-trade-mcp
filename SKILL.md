---
name: superior-trade-api
description: Interact with the Superior Trade API to backtest and deploy Freqtrade strategies on cloud Kubernetes. Use when the user wants to create, backtest, or deploy trading strategies, manage exchange credentials, monitor deployments, or check backtest results via the Superior Trade API.
---

# Superior Trade API

Use the MCP tools (check_health, create_backtest, start_backtest, etc.) to interact with the API. Do NOT construct HTTP requests manually.

## Authentication

API keys are obtained via magic-link: call `POST /auth/sign-in/magic-link` with the user's email. The API key (prefixed `st_live_`) is sent to their inbox. Use it in the `x-api-key` header for all protected endpoints.

## Supported Exchange: Hyperliquid

| Trading Mode | Pair Format | Example | Notes |
|---|---|---|---|
| Spot | `BASE/QUOTE` | `BTC/USDC` | No stoploss on exchange, no market orders |
| Futures | `BASE/QUOTE:SETTLE` | `BTC/USDC:USDC` | Requires `trading_mode` + `margin_mode` in config |

- Stake currency: `USDC`
- Margin modes: `"isolated"` or `"cross"`
- Data availability starts from approximately November 2025
- Hyperliquid is a DEX — uses wallet-based signing, not traditional API keys

### Non-Crypto Assets (HIP-3)

Hyperliquid's `xyz` dex supports stocks, commodities, FX, and ETFs:
- Stocks: `TSLA`, `NVDA`, etc.
- Commodities: use `xyz:GOLD/USDC:USDC` — do NOT use `XAU/USDC:USDC` or `XAG/USDC:USDC` (those symbols do not exist)
- FX and ETFs also available via `xyz` prefix

## Agent Behavior

- Make all API calls directly via MCP tools. Never show curl commands or raw payloads.
- Gather info conversationally (pair, timeframe, stake amount, credentials) — don't dump a wall of fields.
- After backtesting: warn if results are poor before offering to deploy.
- If the agent struggles with complex strategy logic (2+ consecutive 0-trade backtests), recommend using a higher-capability model.

## Hyperliquid Credentials

When a deployment needs credentials, guide the user:
1. Create an agent wallet at https://app.hyperliquid.xyz/API — it can trade but cannot withdraw, keeping funds safe.
2. Collect: **agent wallet private key** (0x...) and **main wallet address** (0x...).
3. Use `add_deployment_credentials` with: `private_key` = agent wallet private key, `wallet_address` = main wallet address.

Important:
- Use one wallet per deployment to prevent trade conflicts.
- Credentials are optional — missing credentials means paper trading mode.

## Config Rules

- Must include: `exchange` (with `pair_whitelist`), `stake_currency`, `stake_amount`, `timeframe`, `stoploss`, `minimal_roi`, `pairlists`, `entry_pricing`, `exit_pricing`
- Do NOT include `dry_run` or `api_server` (managed by Superior Trade)
- Futures requires: `trading_mode: "futures"` and `margin_mode: "cross"` (or `"isolated"`)
- Common fields: `max_open_trades`, `minimal_roi`, `trailing_stop`, `trailing_stop_positive`, `entry_pricing`, `exit_pricing`

## Strategy Code Template

The `code` field must be a valid Freqtrade `IStrategy` subclass. Use `import talib.abstract as ta` for indicators.

```python
from freqtrade.strategy import IStrategy
import pandas as pd
import talib.abstract as ta


class MyCustomStrategy(IStrategy):
    minimal_roi = {"0": 0.10, "30": 0.05, "120": 0.02}
    stoploss = -0.10
    trailing_stop = False
    timeframe = '5m'
    process_only_new_candles = True
    startup_candle_count = 20

    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        dataframe['sma_20'] = ta.SMA(dataframe, timeperiod=20)
        return dataframe

    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        dataframe.loc[
            (dataframe['rsi'] < 30) & (dataframe['close'] > dataframe['sma_20']),
            'enter_long'
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        dataframe.loc[(dataframe['rsi'] > 70), 'exit_long'] = 1
        return dataframe
```

## Workflows

### Backtest
1. Build config + strategy code from user intent
2. `create_backtest` → `start_backtest` → poll `get_backtest_status` every 10s → `get_backtest` for results
3. If failed: check `get_backtest_logs`

### Deploy
1. `create_deployment` with config, code, name
2. Ask user for Hyperliquid credentials → `add_deployment_credentials`
3. Confirm with user → `start_deployment`
4. Monitor: `get_deployment_status`, `get_deployment_logs`
