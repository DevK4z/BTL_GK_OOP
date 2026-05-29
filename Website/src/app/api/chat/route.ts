import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, homeState } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    // Prepare system instructions for Gemini
    const systemPrompt = `You are the Coordinator for the Isometric Orthographic Smart Home Blueprint. 
Communicate in clean, technical data terms.
When the user gives a command, you MUST use the provided function tools to execute it.
If the user asks for the status, use 'getHomeStatus' to read the blueprint, and respond with technical status (e.g., "[ĐÈN BẾP] TRẠNG THÁI: ONLINE. Độ sáng: 80%").
If you execute a command, confirm it technically (e.g., "Technical data updated: [ĐIỀU HÒA PHÒNG NGỦ] Nhiệt độ set to 22°C. Schema is synchronized.")

Current Home State Context (Read Only Snapshot):
${JSON.stringify(homeState, null, 2)}
`;

    // Define function calling tools
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'getHomeStatus',
            description: 'Returns the current technical data of all devices in the Isometric Blueprint.',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'toggleDevice',
            description: 'Turns a specific device ON or OFF.',
            parameters: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'The ID of the room (e.g., room-1)',
                },
                deviceId: {
                  type: 'string',
                  description: 'The ID of the device (e.g., D1)',
                },
                state: {
                  type: 'boolean',
                  description: 'True to turn ON (ONLINE), false to turn OFF (OFFLINE)',
                },
              },
              required: ['roomId', 'deviceId', 'state'],
            },
          },
          {
            name: 'setDeviceValue',
            description: 'Configures a numerical data value for a device (e.g., temperature for AC, brightness for Light).',
            parameters: {
              type: 'object',
              properties: {
                roomId: {
                  type: 'string',
                  description: 'The ID of the room',
                },
                deviceId: {
                  type: 'string',
                  description: 'The ID of the device',
                },
                type: {
                  type: 'string',
                  description: 'The type of device: SmartLight or SmartAC',
                },
                value: {
                  type: 'number',
                  description: 'The new numerical value to set',
                },
              },
              required: ['roomId', 'deviceId', 'type', 'value'],
            },
          },
          {
            name: 'executeRoutine',
            description: 'Executes a predefined technical routine macro (e.g., Night Mode, All Off).',
            parameters: {
              type: 'object',
              properties: {
                routineName: {
                  type: 'string',
                  description: 'The name of the routine to execute (e.g., night_mode, all_off, all_on, leave_home)',
                },
              },
              required: ['routineName'],
            },
          }
        ],
      },
    ];

    // Build the request body for Gemini API
    const geminiRequestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      tools: tools,
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to call Gemini API');
    }

    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error('No valid response from Gemini.');
    }

    const parts = candidate.content.parts;
    
    // Check if the model decided to call a function
    const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
    const textResponse = parts.find((p: any) => p.text)?.text || '';

    return NextResponse.json({
      text: textResponse,
      functionCalls: functionCalls.length > 0 ? functionCalls : null,
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
