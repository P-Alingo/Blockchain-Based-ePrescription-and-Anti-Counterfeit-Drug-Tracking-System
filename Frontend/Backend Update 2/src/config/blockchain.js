import { ethers } from "ethers";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

const contractABI = JSON.parse(
  await import(`file://${path.resolve(__dirname, "contractABI.json")}`, { assert: { type: "json" } }).then(
    (mod) => mod.default
  )
);

const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);

async function listenToContractEvents(contractInstance, prisma, loggerInstance) {
  contractInstance.on("*", async (...args) => {
    try {
      const event = args[args.length - 1];
      loggerInstance.info(`Received event: ${event.event} txHash: ${event.transactionHash}`);

      // Save event to DB
      await prisma.blockchainEventLog.upsert({
        where: { eventName_transactionHash: { eventName: event.event, transactionHash: event.transactionHash } },
        update: {
          eventData: event.args ? JSON.parse(JSON.stringify(event.args)) : {},
          blockNumber: event.blockNumber,
          createdAt: new Date(),
        },
        create: {
          eventName: event.event,
          eventData: event.args ? JSON.parse(JSON.stringify(event.args)) : {},
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        },
      });
    } catch (error) {
      loggerInstance.error("Error processing blockchain event", error);
    }
  });

  loggerInstance.info("Blockchain event listeners registered");
}

export { provider, contract, listenToContractEvents };
