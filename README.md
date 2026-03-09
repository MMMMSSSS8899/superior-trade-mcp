# Superior Trade MCP Server

MCP (Model Context Protocol) server for the [Superior Trade API](https://api.superior.trade). Enables AI coding assistants like Claude Code, Cursor, and Windsurf to manage trading strategies, backtests, and deployments via typed tools.

## Quick Start

```bash
npm install
npm run build
```

Add your API key to `.mcp.json`:
```json
{
  "mcpServers": {
    "superior-trade": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "SUPERIOR_TRADE_API_URL": "https://api.superior.trade",
        "SUPERIOR_TRADE_API_KEY": "your-api-key"
      }
    }
  }
}
```

Get an API key by sending your email to `POST https://api.superior.trade/auth/sign-in/magic-link`.

## Tools (18)

| Tool | Description |
|------|-------------|
| `check_health` | Verify API connectivity |
| `list_backtests` | List backtests (paginated) |
| `create_backtest` | Create a backtest with config, code, timerange, stake_amount |
| `get_backtest` | Get full backtest details and results |
| `get_backtest_status` | Poll execution status |
| `start_backtest` | Start a pending backtest |
| `cancel_backtest` | Cancel a running/pending backtest |
| `get_backtest_logs` | Get execution logs (paginated) |
| `delete_backtest` | Delete a backtest |
| `list_deployments` | List deployments (paginated) |
| `create_deployment` | Create a deployment with config, code, name |
| `get_deployment` | Get full deployment details |
| `get_deployment_status` | Get live status with pod info |
| `start_deployment` | Start a stopped deployment |
| `stop_deployment` | Stop a running deployment |
| `add_deployment_credentials` | Store exchange credentials (private_key + wallet_address) |
| `get_deployment_logs` | Get deployment logs (paginated) |
| `delete_deployment` | Delete a deployment |

## Documentation

- [SKILL.md](./SKILL.md) — Agent workflow guidance, exchange info, strategy templates

## Editor Compatibility

| Editor | Config Location |
|--------|----------------|
| Claude Code | `.mcp.json` at project root or `.claude/mcp.json` |
| Cursor | `.mcp.json` at project root |
| Windsurf | `.mcp.json` at project root |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
