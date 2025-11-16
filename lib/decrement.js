import fs from "fs/promises";
import path from "path";
import { getCount } from "./getcount";

const COUNT_PATH = path.join(process.cwd(), "data", "count.txt");

export async function decrement() {
  const current = await getCount();
  const next = current - 1;
  await fs.writeFile(COUNT_PATH, String(next));
  return next;
}
