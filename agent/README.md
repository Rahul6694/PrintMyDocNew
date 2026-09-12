# PrintMyDoc Agent

A small background service you run on the same computer as your printer(s). It:

1. Detects printers already installed on this machine (via the OS's own print system —
   it does **not** install printer drivers; the printer must already work from this
   computer's normal print dialog).
2. Reports that printer list to your PrintMyDoc dashboard every 15 seconds.
3. Polls for orders your shop has moved to "Printing" and sends them to your default
   printer automatically.

## Setup

```bash
cd agent
npm install
cp .env.example .env
```

1. In the dashboard, go to **Business Setup → Printers → Generate Credentials**.
2. Copy the Shop ID and Secret Key into `.env`.
3. `npm start`

Leave it running in the background (e.g. as a login item / systemd service / Task
Scheduler task) so it's always online while your shop is open.

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
