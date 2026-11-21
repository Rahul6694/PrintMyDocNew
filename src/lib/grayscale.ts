import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Many printer drivers ignore the "monochrome" job option the agent sends, so a
// B/W order can still come out in colour. Converting the file itself to
// grayscale before the agent downloads it makes B/W independent of the driver.
//
// Uses system tools (no native npm deps):
//   - PDF:       Ghostscript (`gs`, override with GHOSTSCRIPT_PATH)
//   - JPG / PNG: ImageMagick (`magick` or `convert`, override with IMAGEMAGICK_PATH)
// If a tool is missing or fails, the original file is returned and the agent's
// monochrome print flag remains the fallback.
export async function toGrayscale(buffer: Buffer, fileName: string): Promise<Buffer> {
  const ext = path.extname(fileName).toLowerCase();
  if (![".pdf", ".jpg", ".jpeg", ".png"].includes(ext)) return buffer;

  const dir = await mkdtemp(path.join(os.tmpdir(), "pmd-gray-"));
  const input = path.join(dir, `in${ext}`);
  const output = path.join(dir, `out${ext}`);
  try {
    await writeFile(input, buffer);
    if (ext === ".pdf") {
      await execFileAsync(process.env.GHOSTSCRIPT_PATH || "gs", [
        "-q",
        "-dNOPAUSE",
        "-dBATCH",
        "-dSAFER",
        "-sDEVICE=pdfwrite",
        "-sColorConversionStrategy=Gray",
        "-sProcessColorModel=DeviceGray",
        "-dOverrideICC",
        `-sOutputFile=${output}`,
        input,
      ], { timeout: 120_000 });
    } else {
      await runImageMagick([input, "-colorspace", "Gray", output]);
    }
    return await readFile(output);
  } catch (err) {
    console.warn(`[grayscale] could not convert ${fileName}, sending original:`, (err as Error).message);
    return buffer;
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function runImageMagick(args: string[]) {
  const candidates = process.env.IMAGEMAGICK_PATH ? [process.env.IMAGEMAGICK_PATH] : ["magick", "convert"];
  let lastErr: unknown;
  for (const bin of candidates) {
    try {
      await execFileAsync(bin, args, { timeout: 60_000 });
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
