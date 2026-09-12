const { execFile } = require("child_process");
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

// Prints a file via the OS print system. Duplex/color options are best-effort:
// CUPS (`lp`) accepts them directly; Windows has no universal CLI for silent
// arbitrary-file printing, so it shells out to SumatraPDF (must be installed —
// see agent/README.md) and copies/duplex must be set as the printer's default.
async function printFile({ printerName, filePath, copies, sided, paperTray }) {
  if (IS_WINDOWS) {
    // Sumatra's silent-print mode has no tray-select flag — tray follows the printer's own default on Windows.
    const sumatraPath = process.env.SUMATRA_PATH || "SumatraPDF.exe";
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
