import fs from "fs/promises";
import path from "path";

const COUNT_PATH = path.join(process.cwd(), "data", "count.txt");

export async function getCount() {
  const raw = await fs.readFile(COUNT_PATH, "utf8").catch(() => "0");
  const n = parseFloat(String(raw).trim());
  if (Number.isNaN(n)) {
    return 0;
  }
  return n;
}
