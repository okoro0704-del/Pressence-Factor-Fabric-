/**
 * @file Blockchain Event Listener
 * @description Listens for AccountCreated events and triggers webhooks
 */

import { ethers } from "ethers";
import {
  SHARED_ACCOUNT_FACTORY_ABI,
  SHARED_ACCOUNT_FACTORY_ADDRESS,
} from "../pff/sharedAccountFactory";

/**
 * Event listener configuration
 */
interface EventListenerConfig {
  rpcUrl: string;
  webhookUrl: string;
  pollingInterval?: number; // milliseconds
}

/**
 * Start listening for AccountCreated events
 */
export async function startAccountCreatedListener(config: EventListenerConfig) {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  
  const factory = new ethers.Contract(
    SHARED_ACCOUNT_FACTORY_ADDRESS,
    SHARED_ACCOUNT_FACTORY_ABI,
    provider
  );
  
  console.log("[EVENT LISTENER] Starting AccountCreated listener...");
  console.log("[EVENT LISTENER] Factory:", SHARED_ACCOUNT_FACTORY_ADDRESS);
  console.log("[EVENT LISTENER] Webhook:", config.webhookUrl);
  
  // Listen for AccountCreated events
  factory.on(
    "AccountCreated",
    async (
      account: string,
      sovereignID: string,
      partner: string,
      accountName: string,
      timestamp: ethers.BigNumber,
      event: ethers.Event
    ) => {
      console.log("[EVENT] AccountCreated detected:", {
        account,
        sovereignID,
        partner,
        accountName,
        tx: event.transactionHash,
      });
      
      try {
        // Send webhook
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: "AccountCreated",
            accountAddress: account,
            sovereignID,
            partnerAddress: partner,
            accountName,
            timestamp: timestamp.toNumber(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          }),
        });
        
        if (response.ok) {
          console.log("[WEBHOOK] Successfully sent to:", config.webhookUrl);
        } else {
          console.error("[WEBHOOK ERROR] Status:", response.status);
        }
      } catch (error) {
        console.error("[WEBHOOK ERROR]", error);
      }
    }
  );
  
  // Handle errors
  factory.on("error", (error: Error) => {
    console.error("[EVENT LISTENER ERROR]", error);
  });
  
  return factory;
}

/**
 * Get past AccountCreated events
 */
export async function getPastAccountCreatedEvents(
  rpcUrl: string,
  fromBlock: number = 0,
  toBlock: number | "latest" = "latest"
) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  
  const factory = new ethers.Contract(
    SHARED_ACCOUNT_FACTORY_ADDRESS,
    SHARED_ACCOUNT_FACTORY_ABI,
    provider
  );
  
  console.log("[EVENT QUERY] Fetching past events...");
  console.log("[EVENT QUERY] From block:", fromBlock);
  console.log("[EVENT QUERY] To block:", toBlock);
  
  const filter = factory.filters.AccountCreated();
  const events = await factory.queryFilter(filter, fromBlock, toBlock);
  
  console.log("[EVENT QUERY] Found", events.length, "events");
  
  return events.map((event) => ({
    accountAddress: event.args?.account,
    sovereignID: event.args?.sovereignID,
    partnerAddress: event.args?.partner,
    accountName: event.args?.accountName,
    timestamp: event.args?.timestamp.toNumber(),
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
  }));
}

/**
 * Replay past events to webhook
 */
export async function replayPastEvents(
  rpcUrl: string,
  webhookUrl: string,
  fromBlock: number = 0
) {
  const events = await getPastAccountCreatedEvents(rpcUrl, fromBlock);
  
  console.log("[REPLAY] Replaying", events.length, "events to webhook...");
  
  for (const event of events) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "AccountCreated",
          ...event,
        }),
      });
      
      console.log("[REPLAY] Sent event:", event.transactionHash);
    } catch (error) {
      console.error("[REPLAY ERROR]", error);
    }
  }
  
  console.log("[REPLAY] Complete");
}

/**
 * Example usage (for server-side script)
 */
export async function startEventListenerService() {
  const config: EventListenerConfig = {
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    webhookUrl: process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/account-created",
    pollingInterval: 15000, // 15 seconds
  };
  
  await startAccountCreatedListener(config);
  
  console.log("[SERVICE] Event listener service started");
}

