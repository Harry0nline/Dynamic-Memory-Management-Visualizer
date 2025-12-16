import { GoogleGenAI } from "@google/genai";
import { Block, HeapStats } from '../types';

let ai: GoogleGenAI | null = null;

const getAIClient = () => {
  if (!ai && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const analyzeHeapState = async (blocks: Block[], stats: HeapStats): Promise<string> => {
  const client = getAIClient();
  if (!client) {
    return "API Key not configured. Unable to perform AI analysis.";
  }

  const prompt = `
    You are a system programming expert (like a senior C++ engineer).
    Analyze the following heap memory state and provide a concise technical summary (max 3 sentences).
    Focus on fragmentation, efficiency, and potential risks.
    
    Heap Stats:
    - Total Size: ${stats.totalSize}
    - Used: ${stats.usedSize}
    - Free: ${stats.freeSize}
    - Fragmentation Index: ${(stats.fragmentation * 100).toFixed(1)}%
    
    Memory Map (Address: Size [Allocated/Free]):
    ${blocks.map(b => `${b.startAddress}: ${b.size} [${b.isAllocated ? 'Allocated' : 'Free'}]`).join('\n')}
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Failed to retrieve analysis from AI.";
  }
};
