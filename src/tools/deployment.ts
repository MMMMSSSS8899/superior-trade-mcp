import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../client.js";

export function registerDeploymentTools(server: McpServer, client: ApiClient) {
  server.tool(
    "list_deployments",
    "List all deployments with cursor pagination. Use get_deployment for full details.",
    {
      cursor: z.string().optional().describe("Pagination cursor from previous response's nextCursor"),
      limit: z.number().optional().describe("Number of items per page"),
    },
    async ({ cursor, limit }) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (limit) params.set("limit", String(limit));
      const qs = params.toString();
      const result = await client.get(`/v1/deployment${qs ? `?${qs}` : ""}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_deployment",
    "Create a live trading deployment. After creation, add credentials with add_deployment_credentials before starting. Config/code validation is the same as backtesting.",
    {
      config: z.object({}).passthrough().describe("Freqtrade configuration object"),
      code: z.string().describe("Python strategy code (valid IStrategy subclass)"),
      name: z.string().describe("Human-readable deployment name"),
    },
    async ({ config, code, name }) => {
      const result = await client.post("/v1/deployment", { config, code, name });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_deployment",
    "Get full deployment details including status, pods, and credentials status. credentialsStatus must be 'stored' before starting.",
    {
      id: z.string().describe("Deployment ID"),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/deployment/${id}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_deployment_status",
    "Get live deployment status with pod info. Shows real-time K8s status.",
    {
      id: z.string().describe("Deployment ID"),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/deployment/${id}/status`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "start_deployment",
    "Start a stopped deployment. Credentials must be stored first (credentialsStatus: 'stored'). Use add_deployment_credentials if missing.",
    {
      id: z.string().describe("Deployment ID"),
    },
    async ({ id }) => {
      const result = await client.put(`/v1/deployment/${id}/status`, { action: "start" });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "stop_deployment",
    "Stop a running deployment. Scales pods to 0. Can be restarted later with start_deployment.",
    {
      id: z.string().describe("Deployment ID"),
    },
    async ({ id }) => {
      const result = await client.put(`/v1/deployment/${id}/status`, { action: "stop" });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_deployment_credentials",
    `Store exchange credentials for a deployment. Credentials are optional — missing credentials means paper trading mode.
For Hyperliquid: private_key is the agent wallet private key, wallet_address is the main wallet address.
Use one wallet per deployment to prevent trade conflicts.
Guide users to create an agent wallet at https://app.hyperliquid.xyz/API if needed.`,
    {
      id: z.string().describe("Deployment ID"),
      exchange: z.string().describe("Exchange name (e.g. 'hyperliquid')"),
      private_key: z.string().describe("Exchange API private key (for Hyperliquid: agent wallet private key)"),
      wallet_address: z.string().optional().describe("Wallet address (for Hyperliquid: main wallet address)"),
    },
    async ({ id, exchange, private_key, wallet_address }) => {
      const body: Record<string, string> = { exchange, private_key };
      if (wallet_address) body.wallet_address = wallet_address;
      const result = await client.post(`/v1/deployment/${id}/credentials`, body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_deployment_logs",
    "Get deployment logs from Cloud Logging. Use to monitor live trading activity or diagnose issues. Supports pagination.",
    {
      id: z.string().describe("Deployment ID"),
      pageSize: z.coerce.number().optional().describe("Number of log entries per page (default 100)"),
      pageToken: z.string().optional().describe("Pagination token from previous response"),
    },
    async ({ id, pageSize, pageToken }) => {
      const params = new URLSearchParams();
      if (pageSize) params.set("pageSize", String(pageSize));
      if (pageToken) params.set("pageToken", pageToken);
      const qs = params.toString();
      const result = await client.get(`/v1/deployment/${id}/logs${qs ? `?${qs}` : ""}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_deployment",
    "Permanently delete a deployment and its K8s resources. Stops the deployment first if running.",
    {
      id: z.string().describe("Deployment ID"),
    },
    async ({ id }) => {
      const result = await client.delete(`/v1/deployment/${id}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
