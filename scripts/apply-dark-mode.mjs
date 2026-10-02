// One-off script: adds `dark:` companion classes next to common Tailwind
// light-mode utility classes across the app, additively (never removes or
// alters existing classes). Safe to inspect via `git diff` and revert if needed.
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walk(dir) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results = results.concat(walk(full));
    } else if (full.endsWith(".jsx")) {
      results.push(full);
    }
  }
  return results;
}

const SKIP_FILES = new Set([
  "src/components/DashboardLayout.jsx",
  "src/components/StatsCard.jsx",
  "src/components/ThemeToggle.jsx",
  "src/pages/DashboardHome.jsx",
  "src/pages/StaffManagement.jsx",
]);

// base class -> its dark companion. Order matters: longer/more specific
// prefixes first so e.g. `hover:bg-slate-100` doesn't get double-handled by
// the plain `bg-slate-100` rule too.
const RULES = [
  ["hover:bg-slate-50", "dark:hover:bg-slate-800"],
  ["hover:bg-slate-100", "dark:hover:bg-slate-700"],
  ["hover:border-slate-300", "dark:hover:border-slate-600"],
  ["hover:text-slate-600", "dark:hover:text-slate-300"],
  ["hover:text-red-600", "dark:hover:text-red-400"],
  ["focus:bg-white", "dark:focus:bg-slate-800"],
  ["bg-white", "dark:bg-slate-800"],
  ["bg-slate-50", "dark:bg-slate-900"],
  ["bg-slate-100", "dark:bg-slate-700"],
  ["text-slate-900", "dark:text-slate-100"],
  ["text-slate-800", "dark:text-slate-100"],
  ["text-slate-700", "dark:text-slate-200"],
  ["text-slate-600", "dark:text-slate-300"],
  ["text-slate-500", "dark:text-slate-400"],
  ["text-slate-400", "dark:text-slate-500"],
  ["border-slate-200", "dark:border-slate-700"],
  ["border-slate-100", "dark:border-slate-700"],
  ["divide-slate-200", "dark:divide-slate-700"],
  ["divide-slate-100", "dark:divide-slate-700"],
  ["placeholder-slate-400", "dark:placeholder-slate-500"],
  ["placeholder:text-slate-400", "dark:placeholder:text-slate-500"],
];

const files = [...walk("src/pages"), ...walk("src/components")]
  .map((f) => f.replace(/\\/g, "/"))
  .filter((f) => !SKIP_FILES.has(f));

let totalFiles = 0;
let totalInsertions = 0;

for (const file of files) {
  let content = readFileSync(file, "utf8");
  let changed = false;

  for (const [base, dark] of RULES) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Require the base class to start right after a real token boundary
    // (start-of-string, whitespace, or a quote) — NOT after a colon — so we
    // never match inside a modifier-prefixed class like `hover:bg-white` or
    // an already-inserted `dark:bg-slate-800`, only the bare base class.
    const pattern = new RegExp(
      `(^|[\\s"'\`])${esc(base)}\\b(?!\\s+${esc(dark)}\\b)`,
      "g"
    );
    const before = content;
    content = content.replace(pattern, (_match, lead) => `${lead}${base} ${dark}`);
    if (content !== before) {
      changed = true;
      totalInsertions += 1;
    }
  }

  if (changed) {
    writeFileSync(file, content);
    totalFiles += 1;
  }
}

console.log(`Updated ${totalFiles} files.`);
