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
  scheduled_time: string;
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

  // Try to list available models via REST API
  let modelName = 'gemini-pro'; // default fallback
  
  try {
    console.log('[Gemini] Fetching available models...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      const availableModels = data.models || [];
      console.log(`[Gemini] Found ${availableModels.length} available models`);
      
      // Find a Gemini model that supports generateContent
      const suitableModel = availableModels.find((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent') &&
        m.name?.includes('gemini')
      );
      
      if (suitableModel) {
        // Extract model name (format is usually "models/gemini-pro" or "models/gemini-1.5-pro")
        modelName = suitableModel.name.replace('models/', '');
        console.log(`[Gemini] Using model: ${modelName}`);
      } else if (availableModels.length > 0) {
        // Use the first Gemini model found
        const geminiModel = availableModels.find((m: any) => m.name?.includes('gemini'));
        if (geminiModel) {
          modelName = geminiModel.name.replace('models/', '');
          console.log(`[Gemini] Using first Gemini model found: ${modelName}`);
        } else {
          console.warn('[Gemini] No Gemini models found in available models');
          console.log('[Gemini] Available models:', availableModels.map((m: any) => m.name).join(', '));
        }
      }
    } else {
      console.warn('[Gemini] Could not fetch model list, using default: gemini-pro');
    }
  } catch (listError) {
    console.warn('[Gemini] Error listing models, will try default models:', listError);
  }

  // Try models in order of preference
  const modelsToTry = [
    modelName, // Use the model we found, or fallback
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-pro',
  ].filter((m, i, arr) => arr.indexOf(m) === i); // Remove duplicates

  let lastError: any = null;
  
  for (const tryModelName of modelsToTry) {
    try {
      console.log(`[Gemini] Trying model: ${tryModelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: tryModelName,
        generationConfig: {
          temperature: 0.3,
          // Try JSON format, but it may not be supported by all models
          responseMimeType: 'application/json',
        },
      });

    // Format dates for the prompt
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
        hour12: false
      });
      const endFormatted = end.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      timeContext = `\n\nTask Schedule:\n- Start: ${startFormatted}\n- End: ${endFormatted}\n\nBreak down the task to fit within this time range.`;
    } else if (startTime) {
      const start = new Date(startTime);
      const startFormatted = start.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      timeContext = `\n\nTask Start Time: ${startFormatted}\n\nBreak down the task starting from this time.`;
    } else if (endTime) {
      const end = new Date(endTime);
      const endFormatted = end.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      timeContext = `\n\nTask End Time: ${endFormatted}\n\nBreak down the task working backwards from this end time.`;
    }

    // Add note context if provided
    let noteContext = '';
    if (note && note.trim()) {
      noteContext = `\n\nImportant Note: ${note.trim()}\n\nPlease consider this note when breaking down the task. For example, if the note mentions travel time, include that in your breakdown.`;
    }

    const prompt = `Break down the following task into smaller sequential subtasks with specific times.

Task: "${taskText}"${timeContext}${noteContext}

Return a JSON object with a "subtasks" array. Each subtask must have:
- text: A clear, actionable subtask description
- scheduled_time: The time for this subtask (format: HH:MM in 24-hour format)
- order_index: Sequential number starting from 1

Example response format:
{
  "subtasks": [
    {"text": "Get off bed", "scheduled_time": "05:30", "order_index": 1},
    {"text": "Brush teeth", "scheduled_time": "05:35", "order_index": 2},
    {"text": "Have breakfast", "scheduled_time": "05:50", "order_index": 3}
  ]
}

Ensure times are realistic, sequential, and fit within the provided time range if specified. Consider any notes provided when creating the breakdown.`;

      console.log('[Gemini] Sending request to Gemini...');
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      
      console.log('[Gemini] Received response (first 200 chars):', content?.substring(0, 200));
      
      if (!content) {
        console.error('[Gemini] No content in response');
        continue; // Try next model
      }

      // Parse the response
      let parsed: any;
      try {
        parsed = JSON.parse(content);
        console.log('[Gemini] Parsed JSON successfully');
      } catch (e) {
        console.error('[Gemini] Failed to parse JSON response. Content:', content);
        console.error('[Gemini] Parse error:', e);
        continue; // Try next model
      }

      // Extract subtasks from the response
      const subtasks = parsed.subtasks || parsed.tasks || [];
      
      if (!Array.isArray(subtasks)) {
        console.error('[Gemini] Subtasks is not an array. Got:', typeof subtasks, subtasks);
        continue; // Try next model
      }

      console.log('[Gemini] Found', subtasks.length, 'subtasks');

      // Validate and return
      const validSubtasks = subtasks
        .filter((task: any) => {
          const isValid = task.text && task.scheduled_time && task.order_index;
          if (!isValid) {
            console.warn('[Gemini] Invalid subtask (missing required fields):', JSON.stringify(task));
          }
          return isValid;
        })
        .map((task: any) => ({
          text: String(task.text).trim(),
          scheduled_time: String(task.scheduled_time),
          order_index: parseInt(String(task.order_index), 10),
        }))
        .filter((task: SubtaskBreakdown) => !isNaN(task.order_index))
        .sort((a: SubtaskBreakdown, b: SubtaskBreakdown) => a.order_index - b.order_index);

      console.log('[Gemini] Returning', validSubtasks.length, 'valid subtasks');
      if (validSubtasks.length > 0) {
        console.log('[Gemini] First subtask:', validSubtasks[0]);
      }
      
      return validSubtasks; // Success! Return the subtasks
    } catch (modelError: any) {
      console.warn(`[Gemini] Model ${tryModelName} failed:`, modelError?.message);
      lastError = modelError;
      // Continue to next model
    }
  }

  // If we get here, all models failed
  console.error('[Gemini] All models failed. Last error:', lastError?.message);
  
  if (lastError?.message?.includes('not found') || lastError?.message?.includes('404')) {
    console.error('[Gemini] No available models found.');
    console.error('[Gemini] This might be due to:');
    console.error('[Gemini] 1. API key doesn\'t have access to any models');
    console.error('[Gemini] 2. Model names are incorrect for your API version');
    console.error('[Gemini] 3. Try removing responseMimeType if JSON format isn\'t supported');
    console.error('[Gemini] Check available models at: https://ai.google.dev/models');
  }
  
  if (lastError?.response) {
    console.error('[Gemini] API Error response:', JSON.stringify(lastError.response, null, 2));
  }
  
  if (lastError?.status) {
    console.error('[Gemini] HTTP Status:', lastError.status);
  }
  
  return [];
}

