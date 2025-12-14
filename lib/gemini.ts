import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey);
  }

  return geminiClient;
}

export interface SubtaskBreakdown {
  text: string;
  start_time: string; // ISO 8601 format datetime string
  end_time: string; // ISO 8601 format datetime string
  order_index: number;
}

export async function breakDownTask(
  taskText: string,
  startTime?: string | null,
  endTime?: string | null,
  note?: string | null
): Promise<SubtaskBreakdown[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY not set, skipping task breakdown');
    console.warn('[Gemini] Make sure GEMINI_API_KEY is set in your .env.local file');
    return [];
  }

  const genAI = getGeminiClient();
  if (!genAI) {
    console.error('[Gemini] Failed to initialize Gemini client');
    return [];
  }

  console.log('[Gemini] Starting task breakdown for:', taskText);

  // Use gemini-2.5-flash directly
  const modelName = 'gemini-2.5-flash';
  console.log(`[Gemini] Using model: ${modelName}`);
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    // Format dates for the prompt with timezone information
    // Get the user's timezone (from the date object, which will be in the server's timezone)
    // We'll format dates in the local timezone and explicitly state it
    const getTimezoneName = () => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return 'local timezone';
      }
    };

    const getTimezoneOffset = () => {
      const offset = -new Date().getTimezoneOffset();
      const hours = Math.floor(Math.abs(offset) / 60);
      const minutes = Math.abs(offset) % 60;
      const sign = offset >= 0 ? '+' : '-';
      return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const timezoneName = getTimezoneName();
    const timezoneOffset = getTimezoneOffset();

    let timeContext = '';
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const startFormatted = start.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });
      const endFormatted = end.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });
      timeContext = `\n\nTask Schedule (Timezone: ${timezoneName} ${timezoneOffset}):\n- Start: ${startFormatted}\n- End: ${endFormatted}\n\nIMPORTANT: All times are in ${timezoneName} (${timezoneOffset}). When creating subtasks, use the same timezone. Break down the task to fit within this time range.`;
    } else if (startTime) {
      const start = new Date(startTime);
      const startFormatted = start.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });
      timeContext = `\n\nTask Start Time (Timezone: ${timezoneName} ${timezoneOffset}): ${startFormatted}\n\nIMPORTANT: All times are in ${timezoneName} (${timezoneOffset}). When creating subtasks, use the same timezone. Break down the task starting from this time.`;
    } else if (endTime) {
      const end = new Date(endTime);
      const endFormatted = end.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });
      timeContext = `\n\nTask End Time (Timezone: ${timezoneName} ${timezoneOffset}): ${endFormatted}\n\nIMPORTANT: All times are in ${timezoneName} (${timezoneOffset}). When creating subtasks, use the same timezone. Break down the task working backwards from this end time.`;
    }

    // Add note context if provided
    let noteContext = '';
    if (note && note.trim()) {
      noteContext = `\n\nImportant Note: ${note.trim()}\n\nPlease consider this note when breaking down the task. For example, if the note mentions travel time, include that in your breakdown.`;
    }

    // Calculate the date for subtasks (use the start date from parent task or today)
    const getSubtaskBaseDate = () => {
      if (startTime) {
        const start = new Date(startTime);
        return start;
      }
      return new Date();
    };

    const baseDate = getSubtaskBaseDate();
    const baseDateStr = baseDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    const prompt = `Break down the following task into meaningful, logical subtasks. Each subtask should represent a substantial, complete action that makes sense as a separate step.

Task: "${taskText}"${timeContext}${noteContext}

IMPORTANT: Break down the task into meaningful actions that a person would naturally think of. Focus on substantial activities, not micro-actions. Avoid breaking down into tiny steps like "open eyes", "rinse hands", "turn on light" - these are too granular. Instead, group related actions into meaningful steps.

DO NOT include micro-actions like:
- "Open eyes", "Sit up", "Stand up" (these are part of "Wake up")
- "Turn on light", "Open door" (these are implied in the main action)
- "Rinse hands", "Rinse mouth" (these are part of "Personal Hygiene" or "Brush teeth")
- "Pick up item", "Put down item" (these are part of the main action)

Return a JSON object with a "subtasks" array. Each subtask must have:
- text: A clear, meaningful action description (e.g., "Wake up", "Personal Hygiene", "Get Dressed", "Prepare and Have Breakfast", NOT "Open eyes" or "Get ready")
- start_time: The start time for this subtask (ISO 8601 format: YYYY-MM-DDTHH:mm:ss, in the same timezone as specified above - ${timezoneName} ${timezoneOffset})
- end_time: The end time for this subtask (ISO 8601 format: YYYY-MM-DDTHH:mm:ss, in the same timezone as specified above - ${timezoneName} ${timezoneOffset})
- order_index: Sequential number starting from 1

IMPORTANT: The base date for all subtasks is ${baseDateStr}. All times should be on this date (or the next day if the task spans multiple days).

Example response format for "Class at University" (06:45 - 11:45):
{
  "subtasks": [
    {"text": "Wake up", "start_time": "${baseDateStr}T05:30:00", "end_time": "${baseDateStr}T05:35:00", "order_index": 1},
    {"text": "Personal Hygiene (brush teeth, wash face)", "start_time": "${baseDateStr}T05:35:00", "end_time": "${baseDateStr}T05:45:00", "order_index": 2},
    {"text": "Get Dressed", "start_time": "${baseDateStr}T05:45:00", "end_time": "${baseDateStr}T05:55:00", "order_index": 3},
    {"text": "Prepare and Have Breakfast", "start_time": "${baseDateStr}T05:55:00", "end_time": "${baseDateStr}T06:10:00", "order_index": 4},
    {"text": "Pack Bag and Final Checks", "start_time": "${baseDateStr}T06:10:00", "end_time": "${baseDateStr}T06:15:00", "order_index": 5},
    {"text": "Travel to University", "start_time": "${baseDateStr}T06:15:00", "end_time": "${baseDateStr}T06:45:00", "order_index": 6},
    {"text": "Arrive and Settle for First Class", "start_time": "${baseDateStr}T06:45:00", "end_time": "${baseDateStr}T06:55:00", "order_index": 7},
    {"text": "Attend First Class", "start_time": "${baseDateStr}T06:55:00", "end_time": "${baseDateStr}T08:55:00", "order_index": 8},
    {"text": "Break between Classes", "start_time": "${baseDateStr}T08:55:00", "end_time": "${baseDateStr}T09:15:00", "order_index": 9},
    {"text": "Attend Second Class", "start_time": "${baseDateStr}T09:15:00", "end_time": "${baseDateStr}T11:15:00", "order_index": 10},
    {"text": "Wrap up and Prepare to Depart", "start_time": "${baseDateStr}T11:15:00", "end_time": "${baseDateStr}T11:45:00", "order_index": 11}
  ]
}

CRITICAL INSTRUCTIONS:
1. Follow the example above - break down tasks into meaningful, substantial actions with realistic time durations
2. Each subtask should represent a complete, logical activity (e.g., "Personal Hygiene" can include brushing teeth and washing face together)
3. Group related actions naturally (e.g., "Prepare and Have Breakfast" combines preparation and eating)
4. DO NOT break down into micro-actions like "open", "close", "pick up", "put down" - these are implied in the main action
5. Use realistic durations: 5-10 minutes for quick tasks, 15-30 minutes for meals, 30-120 minutes for classes/activities, etc.
6. All start_time and end_time values must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
7. All times must be in the same timezone as the task schedule (${timezoneName} ${timezoneOffset})
8. Times must be realistic, sequential, and fit within the provided time range if specified
9. The end_time of one subtask should be close to or equal to the start_time of the next subtask (no gaps unless intentional)
10. Consider any notes provided when creating the breakdown (e.g., travel time, special requirements)
11. Do NOT convert times to a different timezone - use the exact timezone provided
12. If the parent task spans multiple days, subtasks can span to the next day (use the appropriate date)
13. Aim for 5-15 subtasks for most tasks - focus on quality meaningful steps, not quantity
14. Use clear, specific descriptions like "Wake up", "Personal Hygiene", "Get Dressed", "Prepare and Have Breakfast", "Travel to University", "Attend First Class"`;

    console.log('[Gemini] Sending request to Gemini...');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();
    
    console.log('[Gemini] Received response (first 200 chars):', content?.substring(0, 200));
    
    if (!content) {
      console.error('[Gemini] No content in response');
      return [];
    }

    // Parse the response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
      console.log('[Gemini] Parsed JSON successfully');
    } catch (e) {
      console.error('[Gemini] Failed to parse JSON response. Content:', content);
      console.error('[Gemini] Parse error:', e);
      return [];
    }

    // Extract subtasks from the response
    const subtasks = parsed.subtasks || parsed.tasks || [];
    
    if (!Array.isArray(subtasks)) {
      console.error('[Gemini] Subtasks is not an array. Got:', typeof subtasks, subtasks);
      return [];
    }

    console.log('[Gemini] Found', subtasks.length, 'subtasks');

    // Validate and return
    const validSubtasks = subtasks
      .filter((task: any) => {
        const isValid = task.text && task.start_time && task.end_time && task.order_index;
        if (!isValid) {
          console.warn('[Gemini] Invalid subtask (missing required fields):', JSON.stringify(task));
        }
        return isValid;
      })
      .map((task: any) => {
        // Convert the ISO string to a proper Date object, then back to ISO to ensure proper format
        let startTime = String(task.start_time);
        let endTime = String(task.end_time);
        
        // Validate that the times are valid ISO strings
        try {
          const startDate = new Date(startTime);
          const endDate = new Date(endTime);
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('[Gemini] Invalid date format in subtask:', JSON.stringify(task));
            return null;
          }
          // Convert to ISO string to ensure consistent format
          startTime = startDate.toISOString();
          endTime = endDate.toISOString();
        } catch (e) {
          console.warn('[Gemini] Error parsing dates in subtask:', JSON.stringify(task));
          return null;
        }
        
        return {
          text: String(task.text).trim(),
          start_time: startTime,
          end_time: endTime,
          order_index: parseInt(String(task.order_index), 10),
        };
      })
      .filter((task): task is SubtaskBreakdown => task !== null && !isNaN(task.order_index))
      .sort((a: SubtaskBreakdown, b: SubtaskBreakdown) => a.order_index - b.order_index);

    console.log('[Gemini] Returning', validSubtasks.length, 'valid subtasks');
    if (validSubtasks.length > 0) {
      console.log('[Gemini] First subtask:', validSubtasks[0]);
    }
    
    return validSubtasks;
  } catch (error: any) {
    console.error('[Gemini] Error with model:', error?.message);
    
    if (error?.message?.includes('not found') || error?.message?.includes('404')) {
      console.error('[Gemini] Model not found. Check if gemini-2.5-flash is available for your API key.');
    }
    
    if (error?.response) {
      console.error('[Gemini] API Error response:', JSON.stringify(error.response, null, 2));
    }
    
    if (error?.status) {
      console.error('[Gemini] HTTP Status:', error.status);
    }
    
    return [];
  }
}

