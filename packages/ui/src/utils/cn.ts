/**
 * 合并 Tailwind 类名，解决冲突时以后者为准
 */

import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null)[]): string {
  return twMerge(...inputs.filter(Boolean));
}
