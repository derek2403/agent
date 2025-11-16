import fs from "fs/promises";
import path from "path";
import { getCount } from "./getcount";

const COUNT_PATH = path.join(process.cwd(), "data", "count.txt");

export async function add(value) {
  const current = await getCount();
  const next = current + Number(value || 0);
  await fs.writeFile(COUNT_PATH, String(next));
  return next;
}
