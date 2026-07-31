import { executeOmniFocusScript } from '../../utils/scriptExecution.js';

export interface GetForecastTasksOptions {
  days?: number;
  hideCompleted?: boolean;
  includeDeferredOnly?: boolean;
}

export interface ForecastTask {
  id: string;
  name: string;
  note: string;
  taskStatus: string;
  flagged: boolean;
  dueDate: string | null;
  deferDate: string | null;
  plannedDate: string | null;
  estimatedMinutes: number | null;
  projectId: string | null;
  projectName: string | null;
  inInbox: boolean;
  isDue: boolean;
  tags: Array<{ id: string; name: string }>;
}

export interface ForecastData {
  exportDate: string;
  tasksByDate: Record<string, ForecastTask[]>;
}

export interface ForecastResult {
  text: string;
  data: ForecastData;
}

export async function getForecastTasksResult(options: GetForecastTasksOptions = {}): Promise<ForecastResult> {
  const { days = 7, hideCompleted = true, includeDeferredOnly = false } = options;
  
  try {
    // Execute the forecast tasks script
    const result = await executeOmniFocusScript('@forecastTasks.js', { 
      days: days,
      hideCompleted: hideCompleted,
      includeDeferredOnly: includeDeferredOnly
    });
    
    // If result is an object, format it
    if (result && typeof result === 'object') {
      const data = result as ForecastData & { error?: string };
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Format the forecast tasks
      let output = `# 📅 FORECAST - Next ${days} days\n\n`;
      
      if (data.tasksByDate && typeof data.tasksByDate === 'object') {
        const dates = Object.keys(data.tasksByDate).sort();
        
        if (dates.length === 0) {
          output += "🎉 No tasks due in the forecast period - enjoy the calm!\n";
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          dates.forEach(dateStr => {
            const tasks = data.tasksByDate[dateStr];
            if (!tasks || tasks.length === 0) return;
            
            const taskDate = new Date(dateStr);
            const isToday = taskDate.getTime() === today.getTime();
            const isTomorrow = taskDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000;
            const isOverdue = taskDate < today;
            
            let dateHeader = '';
            if (isOverdue) {
              dateHeader = `## ⚠️ OVERDUE - ${taskDate.toLocaleDateString()}`;
            } else if (isToday) {
              dateHeader = `## 🔥 TODAY - ${taskDate.toLocaleDateString()}`;
            } else if (isTomorrow) {
              dateHeader = `## ⏰ TOMORROW - ${taskDate.toLocaleDateString()}`;
            } else {
              const dayOfWeek = taskDate.toLocaleDateString('en-US', { weekday: 'long' });
              dateHeader = `## 📅 ${dayOfWeek} - ${taskDate.toLocaleDateString()}`;
            }
            
            output += `${dateHeader}\n`;
            
            tasks.forEach((task: any) => {
              const flagSymbol = task.flagged ? '🚩 ' : '';
              const projectStr = task.projectName ? ` (${task.projectName})` : ' (Inbox)';
              const statusStr = task.taskStatus !== 'Available' ? ` [${task.taskStatus}]` : '';
              const estimateStr = task.estimatedMinutes ? ` ⏱${task.estimatedMinutes}m` : '';
              const typeIndicator = task.isDue ? '📅' : '🚀'; // Due vs Deferred
              
              output += `• ${typeIndicator} ${flagSymbol}${task.name}${projectStr}${statusStr}${estimateStr}\n`;
              
              if (task.note && task.note.trim()) {
                output += `  📝 ${task.note.trim()}\n`;
              }
            });
            
            output += '\n';
          });
          
          // Summary
          const totalTasks = dates.reduce((sum, date) => sum + data.tasksByDate[date].length, 0);
          output += `📊 **Summary**: ${totalTasks} task${totalTasks === 1 ? '' : 's'} in forecast\n`;
        }
      } else {
        output += "No forecast data available\n";
      }
      
      return { text: output, data };
    }

    throw new Error("OmniFocus returned an unstructured forecast result");
    
  } catch (error) {
    console.error("Error in getForecastTasks:", error);
    throw new Error(`Failed to get forecast tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getForecastTasks(options: GetForecastTasksOptions = {}): Promise<string> {
  return (await getForecastTasksResult(options)).text;
}
