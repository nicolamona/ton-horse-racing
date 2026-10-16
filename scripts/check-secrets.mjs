import { execFileSync } from "node:child_process";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0").filter(Boolean);
const patterns = [
  { name: "private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/ },
  { name: "Cloudflare API token assignment", re: /(?:CLOUDFLARE|CF)_API_TOKEN\s*[:=]\s*["'][^"'\s]{12,}["']/i },
  { name: "TON Center API key literal", re: /TONCENTER_(?:TESTNET|MAINNET)_API_KEY\s*[:=]\s*["'][^"'\s]{12,}["']/i }
];
const findings = [];
for (const file of tracked) {
  if (/^(?:node_modules|\.git)\//.test(file)) continue;
  let content;
  try { content = execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch { continue; }
  for (const { name, re } of patterns) {
    if (re.test(content)) findings.push(`${file}: possible ${name}`);
  }
}
if (findings.length) {
  console.error("Potential hard-coded secrets found (review manually):\n" + findings.join("\n"));
  process.exit(1);
}
console.log(`Working-tree secret-pattern scan passed for ${tracked.length} tracked files. This is a heuristic source scan, not a full history scan or replacement for GitHub secret scanning.`);
