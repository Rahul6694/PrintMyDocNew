# PrintMyDoc Agent

A small background service you run on the same computer as your printer(s). It:

1. Detects printers already installed on this machine (via the OS's own print system —
   it does **not** install printer drivers; the printer must already work from this
   computer's normal print dialog).
2. Reports that printer list to your PrintMyDoc dashboard every 15 seconds.
3. Polls for orders your shop has moved to "Printing" and sends them to your default
   printer automatically.

## For shop owners: install the packaged binary

Download the build for your OS from **Business Setup → Printers** in the dashboard and
run it. On first launch it asks for your Shop ID and Secret Key (from **Generate
Credentials** on that same page) and saves them to `~/.printmydoc/agent-config.json` —
you won't be asked again on later launches. No Node.js install required.

Leave it running in the background (e.g. as a login item / systemd service / Task
Scheduler task) so it's always online while your shop is open.

## For development: run from source

```bash
cd agent
npm install
npm start
```

You'll get the same first-run prompt as the packaged binary. `SERVER_URL`, `SHOP_ID`
and `AGENT_SECRET` env vars (or a `.env` file, see `.env.example`) skip the prompt.

## Building distributable binaries

```bash
cd agent
npm install
npm run build
```

This uses [`pkg`](https://github.com/yao-pkg/pkg) to produce standalone Windows/macOS/
Linux binaries in `agent/dist/`, then publishes them plus a `manifest.json` (version,
per-platform SHA-256 checksums, sizes) into `public/downloads/agent/` so the dashboard's
Printers tab can serve real downloads. Bump `version` in `agent/package.json` before
running this for a new release — the previous version's files are left in place.

## Platform notes

- **macOS / Linux**: uses the standard CUPS command-line tools (`lpstat`, `lp`), which
  ship with the OS. No extra install needed beyond having the printer already set up
  in System Settings / CUPS.
- **Windows**: there's no built-in command to silently print an arbitrary file, so the
  agent shells out to [SumatraPDF](https://www.sumatrapdfreader.org/) in `-print-to`
  mode. Install it and set `SUMATRA_PATH` in `.env` if it's not on your `PATH`.
- Duplex ("back-to-back") and color options are applied on macOS/Linux via CUPS
  options; on Windows they follow whatever the printer's own default is currently set
  to, since Sumatra's silent-print mode doesn't expose them.
