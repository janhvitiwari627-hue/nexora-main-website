import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const signatures = [
  { label: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: "Supabase secret key", pattern: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/ },
  { label: "JWT-like credential", pattern: /\beyJhbGciOiJIUzI1Ni[A-Za-z0-9_-]*\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
];

const findings = [];
for (const file of tracked) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (content.includes("\0")) continue;
  for (const { label, pattern } of signatures) {
    if (pattern.test(content)) findings.push(`${file}: ${label}`);
  }
}

if (findings.length) {
  console.error("Potential committed credentials detected (values withheld):");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`Secret scan passed for ${tracked.length} tracked files.`);
