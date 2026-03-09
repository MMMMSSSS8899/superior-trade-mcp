import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ApiClient } from "./client.js";
import { registerHealthTools } from "./tools/health.js";
import { registerBacktestTools } from "./tools/backtest.js";
import { registerDeploymentTools } from "./tools/deployment.js";

const server = new McpServer({
  name: "superior-trade",
  version: "1.0.0",
});

const client = new ApiClient();

registerHealthTools(server, client);
registerBacktestTools(server, client);
registerDeploymentTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
