// Builds standalone PrintMyDoc Agent binaries for Windows/macOS/Linux via `pkg`,
// then publishes them (+ a manifest with checksums) into the Next.js app's public/
// folder so the dashboard can offer real downloads. Run this whenever the agent
// source or version changes: `npm run build` (inside agent/).
const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const pkg = require("./package.json");
const AGENT_DIR = __dirname;
const DIST_DIR = path.join(AGENT_DIR, "dist");
const PUBLIC_DIR = path.join(AGENT_DIR, "..", "public", "downloads", "agent");
const VERSION_DIR = path.join(PUBLIC_DIR, pkg.version);

// Maps pkg's own `<name>-<platform>-<arch>[.exe]` output naming to what the UI shows.
const BUILD_INFO = {
  "win-x64": { platform: "windows", arch: "x64", label: "Windows · x64" },
  "macos-arm64": { platform: "macos", arch: "arm64", label: "macOS · Apple Silicon (arm64)" },
  "macos-x64": { platform: "macos", arch: "x64", label: "macOS · Intel (x64)" },
  "linux-x64": { platform: "linux", arch: "x64", label: "Linux · x64" },
  "linux-arm64": { platform: "linux", arch: "arm64", label: "Linux · arm64" },
};

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function main() {
  console.log(`Building PrintMyDoc Agent v${pkg.version} for ${Object.keys(BUILD_INFO).length} targets...`);
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["pkg", "."], {
    cwd: AGENT_DIR,
    stdio: "inherit",
  });

  fs.mkdirSync(VERSION_DIR, { recursive: true });

  const builds = [];
  for (const file of fs.readdirSync(DIST_DIR)) {
    const match = file.match(/^printmydoc-agent-(win-x64|macos-arm64|macos-x64|linux-x64|linux-arm64)(\.exe)?$/);
    if (!match) {
      console.warn(`Skipping unrecognized build artifact: ${file}`);
      continue;
    }
    const info = BUILD_INFO[match[1]];
    const srcPath = path.join(DIST_DIR, file);
    const destName = `printmydoc-agent-${pkg.version}-${match[1]}${match[2] || ""}`;
    fs.copyFileSync(srcPath, path.join(VERSION_DIR, destName));
    fs.chmodSync(path.join(VERSION_DIR, destName), 0o755);

    builds.push({
      ...info,
      filename: destName,
      url: `/downloads/agent/${pkg.version}/${destName}`,
      sha256: sha256(srcPath),
      size: fs.statSync(srcPath).size,
    });
  }

  const manifest = {
    version: pkg.version,
    releasedAt: new Date().toISOString(),
    builds,
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nPublished ${builds.length} build(s) to public/downloads/agent/${pkg.version}/`);
  console.log("Updated public/downloads/agent/manifest.json");
}

main();
