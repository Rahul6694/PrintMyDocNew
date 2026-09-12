require("dotenv").config();
const fs = require("fs");
const os = require("os");
const path = require("path");
const { listPrinters, printFile } = require("./printers");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const SHOP_ID = process.env.SHOP_ID;
const AGENT_SECRET = process.env.AGENT_SECRET;
const HEARTBEAT_INTERVAL_MS = 15000;
const JOB_POLL_INTERVAL_MS = 5000;

if (!SHOP_ID || !AGENT_SECRET) {
  console.error("Missing SHOP_ID or AGENT_SECRET. Copy .env.example to .env and fill them in —");
  console.error("generate credentials from the dashboard: Business Setup → Printers → Generate Credentials.");
  process.exit(1);
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "x-shop-id": SHOP_ID,
    "x-agent-secret": AGENT_SECRET,
  };
}

async function sendHeartbeat() {
  try {
    const printers = await listPrinters();
    const res = await fetch(`${SERVER_URL}/api/agent/heartbeat`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ printers, version: "0.1.0" }),
    });
    if (!res.ok) throw new Error(`heartbeat failed: ${res.status}`);
    console.log(`[heartbeat] reported ${printers.length} printer(s)`);
  } catch (err) {
    console.error("[heartbeat] error:", err.message);
  }
}

async function pollJobs() {
  try {
    const res = await fetch(`${SERVER_URL}/api/agent/jobs`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`job poll failed: ${res.status}`);
    const { jobs } = await res.json();

    for (const job of jobs) {
      await handleJob(job);
    }
  } catch (err) {
    console.error("[jobs] error:", err.message);
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

console.log(`PrintMyDoc Agent starting — server: ${SERVER_URL}, shop: ${SHOP_ID}`);
sendHeartbeat();
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
setInterval(pollJobs, JOB_POLL_INTERVAL_MS);
