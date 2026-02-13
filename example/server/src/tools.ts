/**
 * 简单工具定义，供 Agent 调用
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/** 加法工具：计算两数之和 */
export const addTool = tool(
  async ({ a, b }) => {
    const result = a + b;
    return { result, expression: `${a} + ${b} = ${result}` };
  },
  {
    name: "add",
    description: "计算两个数字的和。当用户需要做加法时使用。",
    schema: z.object({
      a: z.number().describe("第一个数"),
      b: z.number().describe("第二个数"),
    }),
  },
);

export const tools = [addTool];
