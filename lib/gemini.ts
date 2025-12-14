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
      timeContext = `\n\nTask Execution Time (Timezone: ${timezoneName} ${timezoneOffset}):\n- Start: ${startFormatted} (when user MUST START doing the task)\n- End: ${endFormatted} (when user MUST FINISH/COMPLETE the main task)\n\nCRITICAL RULES:
1. The start_time is when the user MUST START doing the task
2. The end_time is when the user MUST FINISH/COMPLETE the main task
3. Generate PREPARATION subtasks that occur BEFORE the start_time (waking up, getting ready, traveling, etc.)
4. The main task execution subtasks should fit within start_time to end_time
5. DO NOT include any subtasks AFTER the end_time (no "pack up", "go home", "prepare to leave", etc.) - after end_time, the user can do other things independently
6. All times are in ${timezoneName} (${timezoneOffset}).`;
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
      timeContext = `\n\nTask Execution Time (Timezone: ${timezoneName} ${timezoneOffset}): ${startFormatted} (when user MUST START doing the task)\n\nCRITICAL RULES:
1. The start_time is when the user MUST START doing the task
2. Generate PREPARATION subtasks that occur BEFORE the start_time (waking up, getting ready, traveling, etc.)
3. The main task execution subtasks should start from the start_time
4. All times are in ${timezoneName} (${timezoneOffset}).`;
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
      timeContext = `\n\nTask End Time (Timezone: ${timezoneName} ${timezoneOffset}): ${endFormatted} (when user MUST FINISH/COMPLETE the main task)\n\nCRITICAL RULES:
1. The end_time is when the user MUST FINISH/COMPLETE the main task
2. Generate PREPARATION subtasks that occur BEFORE the task execution (waking up, getting ready, traveling, etc.)
3. The main task execution subtasks should end at the end_time
4. DO NOT include any subtasks AFTER the end_time (no "pack up", "go home", "prepare to leave", etc.)
5. All times are in ${timezoneName} (${timezoneOffset}).`;
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

CRITICAL UNDERSTANDING:
- The start_time is when the user MUST START doing the task
- The end_time is when the user MUST FINISH/COMPLETE the main task
- Your job is to generate subtasks that help the user be WELL-PREPARED for this execution time
- You MUST include PREPARATION subtasks that occur BEFORE the start_time
- Preparation subtasks ensure the user is ready when the execution time arrives
- Examples of preparation: waking up, personal hygiene, getting dressed, preparing materials, traveling to location, etc.
- DO NOT include any subtasks AFTER the end_time (no "pack up", "go home", "prepare to leave", etc.) - after end_time, the user can do other things independently

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

Example response format for "Class at University" (execution time: 06:45 - 11:45):
Notice how preparation subtasks occur BEFORE the execution start time (06:45), and the last subtask ends at the end_time (11:45):
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
    {"text": "Attend Second Class", "start_time": "${baseDateStr}T09:15:00", "end_time": "${baseDateStr}T11:45:00", "order_index": 10}
  ]
}
Note: 
- Subtasks 1-6 are PREPARATION steps that occur BEFORE the execution start time (06:45)
- The last subtask ends at the end_time (11:45) - this is when the main task is completed
- NO subtasks occur AFTER 11:45 (no "pack up", "go home", etc.) - after end_time, the user can do other things independently

CRITICAL INSTRUCTIONS:
1. **PREPARATION FIRST**: Always include preparation subtasks that occur BEFORE the task execution start_time. The user's start_time is when they MUST START doing the task - you need to help them prepare for it.
2. **PREPARATION EXAMPLES**: Include subtasks like waking up, personal hygiene, getting dressed, preparing materials, traveling to location, etc. - all BEFORE the execution start_time.
3. **END TIME IS COMPLETION**: The end_time is when the user MUST FINISH/COMPLETE the main task. The last subtask should end at or before the end_time.
4. **NO POST-TASK ACTIVITIES**: DO NOT include any subtasks AFTER the end_time. No "pack up", "go home", "prepare to leave", "wrap up", etc. After end_time, the user can do other things independently.
5. Follow the example above - break down tasks into meaningful, substantial actions with realistic time durations
6. Each subtask should represent a complete, logical activity (e.g., "Personal Hygiene" can include brushing teeth and washing face together)
7. Group related actions naturally (e.g., "Prepare and Have Breakfast" combines preparation and eating)
8. DO NOT break down into micro-actions like "open", "close", "pick up", "put down" - these are implied in the main action
9. Use realistic durations: 5-10 minutes for quick tasks, 15-30 minutes for meals, 30-120 minutes for classes/activities, etc.
10. All start_time and end_time values must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
11. All times must be in the same timezone as the task schedule (${timezoneName} ${timezoneOffset})
12. Times must be realistic, sequential, and ensure preparation is complete BEFORE the execution start_time
13. The end_time of one subtask should be close to or equal to the start_time of the next subtask (no gaps unless intentional)
14. The last subtask's end_time should be at or before the task's end_time
15. Consider any notes provided when creating the breakdown (e.g., travel time, special requirements)
16. Do NOT convert times to a different timezone - use the exact timezone provided
17. If the parent task spans multiple days, subtasks can span to the next day (use the appropriate date)
18. Aim for 5-15 subtasks for most tasks - focus on quality meaningful steps, not quantity
19. Use clear, specific descriptions like "Wake up", "Personal Hygiene", "Get Dressed", "Prepare and Have Breakfast", "Travel to University", "Attend First Class"
20. **REMEMBER**: 
    - start_time = when user MUST START doing the task
    - end_time = when user MUST FINISH/COMPLETE the main task
    - Include preparation BEFORE start_time
    - End all subtasks at or before end_time
    - NO activities after end_time`;

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

export interface ScheduleSlot {
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
  text: string;
}

export interface OptimalTimeResult {
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
}

export async function determineOptimalTime(
  taskText: string,
  durationMinutes: number,
  schedule: ScheduleSlot[],
  note?: string | null,
  targetDate?: Date
): Promise<OptimalTimeResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY not set, skipping optimal time determination');
    return null;
  }

  const genAI = getGeminiClient();
  if (!genAI) {
    console.error('[Gemini] Failed to initialize Gemini client');
    return null;
  }

  console.log('[Gemini] Determining optimal time for task:', taskText);
  console.log('[Gemini] Duration:', durationMinutes, 'minutes');
  console.log('[Gemini] Schedule slots:', schedule.length);

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    // Get timezone information
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

    // Format schedule for prompt
    const date = targetDate || new Date();
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];
    
    // Format date for display
    const dateDisplay = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let scheduleContext = '';
    if (schedule.length > 0) {
      scheduleContext = `\n\nCurrent Schedule for ${dateDisplay}:\n`;
      schedule.forEach((slot, idx) => {
        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        const startFormatted = start.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const endFormatted = end.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        scheduleContext += `${idx + 1}. ${slot.text}: ${startFormatted} - ${endFormatted}\n`;
      });
    } else {
      scheduleContext = `\n\nCurrent Schedule for ${dateDisplay}: No scheduled tasks\n`;
    }

    // Add note context if provided
    let noteContext = '';
    if (note && note.trim()) {
      noteContext = `\n\nImportant Note: ${note.trim()}\n`;
    }

    const prompt = `You are a scheduling assistant. Your task is to determine the optimal start and end time for a task based on its duration and the user's existing schedule.

Task: "${taskText}"
Duration: ${durationMinutes} minutes${scheduleContext}${noteContext}

CRITICAL REQUIREMENTS:
1. Find the best available time slot that can accommodate ${durationMinutes} minutes
2. Avoid conflicts with existing scheduled tasks
3. Consider reasonable times (e.g., not too early in the morning, not too late at night)
4. If possible, find a gap between existing tasks
5. If no gap is available, suggest the earliest available time after the last scheduled task
6. All times must be in ${timezoneName} (${timezoneOffset})
7. **CRITICAL: The date MUST be exactly ${dateStr} (${dateDisplay}) - DO NOT use any other date**

Return a JSON object with:
{
  "start_time": "ISO 8601 format datetime string (YYYY-MM-DDTHH:mm:ss in ${timezoneName} ${timezoneOffset})",
  "end_time": "ISO 8601 format datetime string (YYYY-MM-DDTHH:mm:ss in ${timezoneName} ${timezoneOffset})"
}

Example response for date ${dateStr}:
{
  "start_time": "${dateStr}T14:00:00",
  "end_time": "${dateStr}T15:00:00"
}

IMPORTANT: 
- start_time and end_time must be exactly ${durationMinutes} minutes apart
- Use the same timezone (${timezoneName} ${timezoneOffset}) as the schedule
- **THE DATE IN start_time AND end_time MUST BE ${dateStr} (${dateDisplay}) - NO EXCEPTIONS**
- The format must be: ${dateStr}THH:mm:ss (e.g., "${dateStr}T14:00:00")
- Do NOT convert to a different timezone
- Do NOT use today's date if it's different from ${dateStr}
- Do NOT use tomorrow's date
- The date portion (YYYY-MM-DD) must match ${dateStr} exactly`;

    console.log('[Gemini] Sending request to determine optimal time...');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();
    
    console.log('[Gemini] Received response:', content?.substring(0, 200));
    
    if (!content) {
      console.error('[Gemini] No content in response');
      return null;
    }

    // Parse the response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
      console.log('[Gemini] Parsed JSON successfully');
    } catch (e) {
      console.error('[Gemini] Failed to parse JSON response. Content:', content);
      console.error('[Gemini] Parse error:', e);
      return null;
    }

    // Validate and return
    if (!parsed.start_time || !parsed.end_time) {
      console.error('[Gemini] Missing start_time or end_time in response');
      return null;
    }

    // Convert to ISO strings and ensure correct date
    try {
      let startDate = new Date(parsed.start_time);
      let endDate = new Date(parsed.end_time);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('[Gemini] Invalid date format in response');
        return null;
      }

      // Ensure the dates match the target date
      // Extract time from Gemini's response and apply it to the target date
      const targetDate = date; // Use the date we set earlier
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const targetDay = targetDate.getDate();

      // Get hours and minutes from Gemini's response
      const startHours = startDate.getHours();
      const startMinutes = startDate.getMinutes();
      const startSeconds = startDate.getSeconds();

      const endHours = endDate.getHours();
      const endMinutes = endDate.getMinutes();
      const endSeconds = endDate.getSeconds();

      // Create new dates with the target date but Gemini's time
      const correctedStartDate = new Date(targetYear, targetMonth, targetDay, startHours, startMinutes, startSeconds);
      const correctedEndDate = new Date(targetYear, targetMonth, targetDay, endHours, endMinutes, endSeconds);

      // Verify duration matches
      const actualDuration = (correctedEndDate.getTime() - correctedStartDate.getTime()) / (1000 * 60);
      if (Math.abs(actualDuration - durationMinutes) > 1) {
        console.warn(`[Gemini] Duration mismatch: expected ${durationMinutes} minutes, got ${actualDuration} minutes`);
        // Recalculate end time to match duration exactly
        correctedEndDate.setTime(correctedStartDate.getTime() + durationMinutes * 60 * 1000);
      }

      // Verify the date matches
      const startDateStr = correctedStartDate.toISOString().split('T')[0];
      const targetDateStr = dateStr;
      if (startDateStr !== targetDateStr) {
        console.warn(`[Gemini] Date mismatch: expected ${targetDateStr}, got ${startDateStr}. Correcting to ${targetDateStr}`);
      }

      console.log('[Gemini] Final times:', correctedStartDate.toISOString(), 'to', correctedEndDate.toISOString());

      return {
        start_time: correctedStartDate.toISOString(),
        end_time: correctedEndDate.toISOString(),
      };
    } catch (e) {
      console.error('[Gemini] Error parsing dates:', e);
      return null;
    }
  } catch (error: any) {
    console.error('[Gemini] Error determining optimal time:', error?.message);
    return null;
  }
}

