import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(html, /ARCADE DEMO\s*[·|]\s*SIN DINERO REAL/i, "demo-only banner must remain visible");
assert.match(html, /no se pueden comprar ni retirar/i, "fictional-credit restriction must remain visible");
assert.match(html, /no solicita firmas/i, "read-only wallet limitation must remain visible");
assert.match(html, /game-logic\.mjs/, "frontend must load the tested game-rules module");
assert.doesNotMatch(html, /\b(?:sendTransaction|signData|requestTransaction)\s*\(/, "frontend must not call wallet transaction/signature methods");

const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(match => !/\bsrc\s*=/.test(match[1]))
  .map(match => ({ attributes: match[1], source: match[2] }));

assert.ok(inlineScripts.length > 0, "expected at least one inline frontend script");

const tempDir = mkdtempSync(join(tmpdir(), "ton-horse-racing-check-"));
try {
  inlineScripts.forEach((script, index) => {
    const file = join(tempDir, `inline-${index}.mjs`);
    writeFileSync(file, script.source, "utf8");
    execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
  });
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

process.stdout.write(`Frontend syntax and demo-only guard checks passed (${inlineScripts.length} inline script(s)).\n`);
