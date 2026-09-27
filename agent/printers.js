const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");
const execFileAsync = util.promisify(execFile);

const IS_WINDOWS = process.platform === "win32";

// Lists printers already installed on this machine via the OS's own print
// system (CUPS on macOS/Linux, the Windows print spooler on Windows). This
// agent never installs drivers — it only talks to printers the OS already knows.
async function listPrinters() {
  if (IS_WINDOWS) {
    const { stdout } = await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      "Get-Printer | Select-Object -ExpandProperty Name",
    ]);
    const names = stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let defaultName = null;
    try {
      const { stdout: defOut } = await execFileAsync("powershell", [
        "-NoProfile",
        "-Command",
        "(Get-CimInstance -ClassName Win32_Printer | Where-Object { $_.Default -eq $true }).Name",
      ]);
      defaultName = defOut.trim() || null;
    } catch {
      /* best-effort */
    }

    return names.map((name) => ({ name, isDefault: name === defaultName, paperTray: "auto" }));
  }

  const { stdout } = await execFileAsync("lpstat", ["-p"]);
  const names = [...stdout.matchAll(/^printer (\S+)/gm)].map((m) => m[1]);

  let defaultName = null;
  try {
    const { stdout: defOut } = await execFileAsync("lpstat", ["-d"]);
    const match = defOut.match(/system default destination: (\S+)/);
    defaultName = match ? match[1] : null;
  } catch {
    /* no default set */
  }

  return names.map((name) => ({ name, isDefault: name === defaultName, paperTray: "auto" }));
}

// Official portable (no-installer) SumatraPDF build, fetched on first print if
// the shop PC doesn't already have Sumatra installed.
const SUMATRA_DOWNLOAD_URL =
  "https://www.sumatrapdfreader.org/dl/rel/3.5.2/SumatraPDF-3.5.2-64.exe";
const AGENT_SUMATRA_PATH = path.join(os.homedir(), ".printmydoc", "SumatraPDF.exe");

let sumatraPathPromise = null;

// Resolution order: SUMATRA_PATH env, a copy the agent downloaded earlier, the
// usual install locations, and finally a one-time download of the portable exe.
// Cached so concurrent jobs share one lookup/download.
function resolveSumatraPath() {
  if (!sumatraPathPromise) {
    sumatraPathPromise = findOrDownloadSumatra().catch((err) => {
      sumatraPathPromise = null; // allow a retry on the next job
      throw err;
    });
  }
  return sumatraPathPromise;
}

async function findOrDownloadSumatra() {
  const candidates = [
    process.env.SUMATRA_PATH,
    AGENT_SUMATRA_PATH,
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "SumatraPDF", "SumatraPDF.exe"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "SumatraPDF", "SumatraPDF.exe"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "SumatraPDF", "SumatraPDF.exe"),
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) return found;

  console.log(`[print] SumatraPDF not found — downloading portable copy to ${AGENT_SUMATRA_PATH}...`);
  try {
    const res = await fetch(SUMATRA_DOWNLOAD_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(AGENT_SUMATRA_PATH), { recursive: true });
    const tmpPath = `${AGENT_SUMATRA_PATH}.download`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, AGENT_SUMATRA_PATH);
  } catch (err) {
    throw new Error(
      `SumatraPDF is required to print on Windows and could not be downloaded automatically (${err.message}). ` +
        `Install it from https://www.sumatrapdfreader.org/ or place SumatraPDF.exe at ${AGENT_SUMATRA_PATH}.`
    );
  }
  console.log("[print] SumatraPDF downloaded.");
  return AGENT_SUMATRA_PATH;
}

// Plain text doesn't need Sumatra: PowerShell's Out-Printer prints it to any
// installed printer. Paths are passed via env vars to avoid quoting issues.
async function printTextFileWindows({ printerName, filePath, copies }) {
  for (let i = 0; i < copies; i++) {
    await execFileAsync(
      "powershell",
      ["-NoProfile", "-Command", "Get-Content -LiteralPath $env:PMD_FILE | Out-Printer -Name $env:PMD_PRINTER"],
      { env: { ...process.env, PMD_FILE: filePath, PMD_PRINTER: printerName } }
    );
  }
}

// Prints a file via the OS print system. Duplex/color options are best-effort:
// CUPS (`lp`) accepts them directly; Windows has no universal CLI for silent
// arbitrary-file printing, so it shells out to SumatraPDF (auto-located or
// downloaded — see resolveSumatraPath) and copies/duplex must be set as the
// printer's default.
async function printFile({ printerName, filePath, copies, sided, paperTray }) {
  if (IS_WINDOWS) {
    if (path.extname(filePath).toLowerCase() === ".txt") {
      await printTextFileWindows({ printerName, filePath, copies });
      return;
    }
    // Sumatra's silent-print mode has no tray-select flag — tray follows the printer's own default on Windows.
    const sumatraPath = await resolveSumatraPath();
    const args = ["-print-to", printerName, "-silent"];
    for (let i = 0; i < copies; i++) args.push(filePath);
    await execFileAsync(sumatraPath, args);
    return;
  }

  const args = ["-d", printerName, "-n", String(copies)];
  if (sided === "back_to_back_auto" || sided === "back_to_back_manual") {
    args.push("-o", "sides=two-sided-long-edge");
  }
  if (paperTray && paperTray !== "auto") {
    // Best-effort: CUPS' InputSlot names vary by driver, so this may be a no-op on some printers.
    args.push("-o", `InputSlot=${paperTray}`);
  }
  args.push(filePath);
  await execFileAsync("lp", args);
}

module.exports = { listPrinters, printFile };
