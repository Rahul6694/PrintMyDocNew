const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const CONFIG_DIR = path.join(os.homedir(), ".printmydoc");
const CONFIG_FILE = path.join(CONFIG_DIR, "agent-config.json");
const DEFAULT_SERVER_URL = "http://localhost:3000";

function readConfigFile() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeConfigFile(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function ask(rl, question, defaultValue) {
  return new Promise((resolve) => {
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    rl.question(`${question}${suffix}: `, (answer) => resolve(answer.trim() || defaultValue || ""));
  });
}

async function runWizard(seed) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\nPrintMyDoc Agent — first-run setup");
  console.log("Find your Shop ID & Secret Key in the dashboard: Business Setup → Printers → Generate Credentials.\n");
  const serverUrl = await ask(rl, "Server URL", seed.serverUrl || DEFAULT_SERVER_URL);
  const shopId = await ask(rl, "Shop ID", seed.shopId);
  const agentSecret = await ask(rl, "Secret Key", seed.agentSecret);
  rl.close();
  return { serverUrl, shopId, agentSecret };
}

// Resolution order: env vars (SHOP_ID/AGENT_SECRET/SERVER_URL) take precedence for
// power users / CI, then the saved config file from a previous first run, then an
// interactive prompt that saves what it collects so future launches don't re-ask.
async function loadConfig() {
  const fromEnv = {
    serverUrl: process.env.SERVER_URL,
    shopId: process.env.SHOP_ID,
    agentSecret: process.env.AGENT_SECRET,
  };
  if (fromEnv.shopId && fromEnv.agentSecret) {
    return { ...fromEnv, serverUrl: fromEnv.serverUrl || DEFAULT_SERVER_URL };
  }

  const fromFile = readConfigFile();
  if (fromFile && fromFile.shopId && fromFile.agentSecret) {
    return fromFile;
  }

  const config = await runWizard({ ...fromFile, ...fromEnv });
  if (!config.shopId || !config.agentSecret) {
    console.error("\nShop ID and Secret Key are required. Run the agent again once you have them.");
    process.exit(1);
  }
  writeConfigFile(config);
  console.log(`\nSaved to ${CONFIG_FILE} — future launches won't ask again.\n`);
  return config;
}

module.exports = { loadConfig, CONFIG_FILE };
