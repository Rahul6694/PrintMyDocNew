require("dotenv").config();
const fs = require("fs");
const os = require("os");
const path = require("path");
const { listPrinters, printFile } = require("./printers");
const { loadConfig } = require("./config");

const AGENT_VERSION = require("./package.json").version;
const HEARTBEAT_INTERVAL_MS = 15000;
const JOB_POLL_INTERVAL_MS = 5000;

let SERVER_URL, SHOP_ID, AGENT_SECRET;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "x-shop-id": SHOP_ID,
    "x-agent-secret": AGENT_SECRET,
  };
}

// Node's fetch throws a bare "fetch failed" for any network-level failure
// (wrong host, connection refused, DNS, offline), which by itself tells a
// shop owner nothing actionable. Translate the common causes into a message
// that names the likely fix, since this is the #1 support issue in practice
// (agent-config.json left pointing at the localhost:3000 setup default).
function describeNetworkError(err) {
  const code = err.cause?.code || err.code;
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "EAI_AGAIN" || err.message === "fetch failed") {
    return (
      `cannot reach server at ${SERVER_URL} (${code || "fetch failed"}). ` +
      `Check the Server URL is correct (dashboard → Business Setup → Printers → Agent Credentials) ` +
      `and this machine has internet/network access. To re-enter it, restart the agent with --reset.`
    );
  }
  return err.message;
}

// Repeating the exact same error every poll (every 5s) floods the console
// with nothing new to act on. Collapse consecutive duplicates per-label into
// one line with a running count instead.
const lastError = new Map(); // label -> { message, count, printedNewline }
function logRepeatable(label, message) {
  const prev = lastError.get(label);
  if (prev && prev.message === message) {
    prev.count += 1;
    process.stdout.write(`\r${label} error: ${message} (x${prev.count})`.padEnd(160));
    return;
  }
  if (prev) process.stdout.write("\n");
  lastError.set(label, { message, count: 1 });
  console.error(`${label} error:`, message);
}

function clearRepeatable(label) {
  if (lastError.has(label)) {
    process.stdout.write("\n");
    lastError.delete(label);
  }
}

async function sendHeartbeat() {
  try {
    const printers = await listPrinters();
    const res = await fetch(`${SERVER_URL}/api/agent/heartbeat`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ printers, version: AGENT_VERSION }),
    });
    if (!res.ok) throw new Error(`heartbeat failed: ${res.status}`);
    clearRepeatable("[heartbeat]");
    console.log(`[heartbeat] reported ${printers.length} printer(s)`);
  } catch (err) {
    logRepeatable("[heartbeat]", describeNetworkError(err));
  }
}

async function pollJobs() {
  try {
    const res = await fetch(`${SERVER_URL}/api/agent/jobs`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`job poll failed: ${res.status}`);
    clearRepeatable("[jobs]");
    const { jobs } = await res.json();

    for (const job of jobs) {
      await handleJob(job);
    }
  } catch (err) {
    logRepeatable("[jobs]", describeNetworkError(err));
  }
}

async function handleJob(job) {
  const tmpFile = path.join(os.tmpdir(), `pmd-job-${job.id}-${job.file_name}`);
  try {
    console.log(`[job ${job.id}] downloading ${job.file_name}...`);
    const fileRes = await fetch(`${SERVER_URL}/api/agent/jobs/${job.id}/file`, {
      headers: authHeaders(),
    });
    if (!fileRes.ok) throw new Error(`file download failed: ${fileRes.status}`);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    fs.writeFileSync(tmpFile, buffer);

    const printerName = job.printer_name;
    if (!printerName) throw new Error("no default printer set for this shop");

    console.log(`[job ${job.id}] printing to ${printerName} (${job.copies}x)...`);
    await printFile({ printerName, filePath: tmpFile, copies: job.copies, sided: job.sided, paperTray: job.paper_tray });

    await reportResult(job.id, "completed");
    console.log(`[job ${job.id}] done`);
  } catch (err) {
    console.error(`[job ${job.id}] failed:`, err.message);
    await reportResult(job.id, "failed", err.message);
  } finally {
    fs.rm(tmpFile, { force: true }, () => {});
  }
}

async function reportResult(jobId, status, errorMessage) {
  await fetch(`${SERVER_URL}/api/agent/jobs/${jobId}/result`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ status, errorMessage }),
  });
}

async function main() {
  const config = await loadConfig();
  SERVER_URL = config.serverUrl;
  SHOP_ID = config.shopId;
  AGENT_SECRET = config.agentSecret;

  console.log(`PrintMyDoc Agent v${AGENT_VERSION} starting — server: ${SERVER_URL}, shop: ${SHOP_ID}`);
  sendHeartbeat();
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  setInterval(pollJobs, JOB_POLL_INTERVAL_MS);
}

main();
