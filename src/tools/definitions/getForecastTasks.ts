import { z } from 'zod';
import { getForecastTasksResult } from '../primitives/getForecastTasks.js';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';

export const schema = z.object({
  days: z.number().min(1).max(30).optional().describe("Number of days to look ahead for forecast (default: 7)"),
  hideCompleted: z.boolean().optional().describe("Set to false to show completed tasks in forecast (default: true)"),
  includeDeferredOnly: z.boolean().optional().describe("Set to true to show only deferred tasks becoming available (default: false)")
});

const forecastTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  note: z.string(),
  taskStatus: z.string(),
  flagged: z.boolean(),
  dueDate: z.string().nullable(),
  deferDate: z.string().nullable(),
  plannedDate: z.string().nullable(),
  estimatedMinutes: z.number().nullable(),
  projectId: z.string().nullable(),
  projectName: z.string().nullable(),
  inInbox: z.boolean(),
  isDue: z.boolean(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })),
});

export const outputSchema = z.object({
  schemaVersion: z.literal('1.0'),
  exportDate: z.string(),
  tasksByDate: z.record(z.array(forecastTaskSchema)),
});

export async function handler(args: z.infer<typeof schema>, extra: RequestHandlerExtra<any, any>) {
  try {
    const result = await getForecastTasksResult({
      days: args.days || 7,
      hideCompleted: args.hideCompleted !== false, // Default to true
      includeDeferredOnly: args.includeDeferredOnly || false
    });
    
    return {
      content: [{
        type: "text" as const,
        text: result.text
      }],
      structuredContent: {
        schemaVersion: '1.0' as const,
        exportDate: result.data.exportDate,
        tasksByDate: result.data.tasksByDate,
      },
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return {
      content: [{
        type: "text" as const,
        text: `Error getting forecast tasks: ${errorMessage}`
      }],
      isError: true
    };
  }
}
