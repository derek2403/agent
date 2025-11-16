import fs from "fs/promises";
import path from "path";
import { getCount } from "./getcount";

const COUNT_PATH = path.join(process.cwd(), "data", "count.txt");

export async function division(value) {
  const current = await getCount();
  const divisor = Number(value || 0);
  const next = divisor === 0 ? current : current / divisor;
  await fs.writeFile(COUNT_PATH, String(next));
  return next;
}
