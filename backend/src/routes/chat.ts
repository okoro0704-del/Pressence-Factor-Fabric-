/**
 * PFF Backend — SOVRYN AI Chat Routes
 * Real-time streaming chat with AI companion for sovereign financial guidance
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import { getSovrynAIResponse } from '../services/sovrynAI';

export const chatRouter = Router();

interface ChatRequest {
  message: string;
  userWallet?: string;
  phoneNumber?: string;
  context?: {
    previousMessages?: Array<{ role: string; text: string }>;
  };
}

/**
 * POST /api/chat
 * Send message to SOVRYN AI and stream response back
 */
chatRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, userWallet, phoneNumber, context } = req.body as ChatRequest;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message is required',
      });
      return;
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get AI response with streaming
    const responseStream = await getSovrynAIResponse({
      message: message.trim(),
      userWallet,
      phoneNumber,
      previousMessages: context?.previousMessages || [],
    });

    // Stream response word by word
    for await (const chunk of responseStream) {
      res.write(chunk);
      // Small delay to simulate natural typing
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    res.end();

  } catch (error) {
    const err = error as Error;
    console.error('[CHAT API] Error:', err);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to process chat message',
        details: err.message,
      });
    } else {
      res.end();
    }
  }
});

/**
 * GET /api/chat/health
 * Check if chat service is available
 */
chatRouter.get('/chat/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'sovryn-ai-chat',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

export default chatRouter;

