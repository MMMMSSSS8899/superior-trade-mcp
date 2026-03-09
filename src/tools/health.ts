import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../client.js";

export function registerHealthTools(server: McpServer, client: ApiClient) {
  server.tool(
    "check_health",
    "Check API health. Use this first to verify connectivity before other operations.",
    {},
    async () => {
      const result = await client.get("/health");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
