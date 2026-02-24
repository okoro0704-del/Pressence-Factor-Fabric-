/**
 * PFF Backend — SOVRYN AI Service
 * AI companion for sovereign financial guidance and PFF Protocol knowledge
 * Architect: Isreal Okoro (mrfundzman)
 */

import { query } from '../db/client';

interface ChatContext {
  message: string;
  userWallet?: string;
  phoneNumber?: string;
  previousMessages: Array<{ role: string; text: string }>;
}

/**
 * Get SOVRYN AI response with streaming support
 * Returns an async generator that yields response chunks
 */
export async function* getSovrynAIResponse(context: ChatContext): AsyncGenerator<string> {
  const { message, userWallet, phoneNumber, previousMessages } = context;
  
  // Get user context if available
  let userContext = '';
  if (phoneNumber) {
    try {
      const userResult = await query(
        `SELECT full_name, vitalization_status, vida_cap_balance 
         FROM user_profiles 
         WHERE phone_number = $1`,
        [phoneNumber]
      );
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        userContext = `User: ${user.full_name || 'Citizen'}, Status: ${user.vitalization_status || 'PENDING'}, Balance: ${user.vida_cap_balance || 0} VIDA CAP`;
      }
    } catch (error) {
      console.error('[SOVRYN AI] Failed to fetch user context:', error);
    }
  }

  // Analyze message intent
  const intent = analyzeIntent(message);
  
  // Generate response based on intent
  const response = generateResponse(intent, message, userContext, previousMessages);
  
  // Stream response word by word
  const words = response.split(' ');
  for (const word of words) {
    yield word + ' ';
  }
}

/**
 * Analyze user message intent
 */
function analyzeIntent(message: string): string {
  const lower = message.toLowerCase();
  
  if (/11 vida|vida distribution|triple.?split|5.?5.?1/i.test(lower)) {
    return 'VIDA_DISTRIBUTION';
  }
  
  if (/vitali[sz]ation|vitali[sz]e|sovereign pulse|4.?pillar/i.test(lower)) {
    return 'VITALIZATION';
  }
  
  if (/balance|wallet|vida cap|ngnvida/i.test(lower)) {
    return 'BALANCE_INQUIRY';
  }
  
  if (/block|treasury|national/i.test(lower)) {
    return 'TREASURY_INQUIRY';
  }
  
  if (/how|what|why|explain|tell me/i.test(lower)) {
    return 'KNOWLEDGE_QUERY';
  }
  
  if (/hello|hi|hey|greetings|good morning|good evening/i.test(lower)) {
    return 'GREETING';
  }
  
  return 'GENERAL';
}

/**
 * Generate AI response based on intent
 */
function generateResponse(
  intent: string, 
  message: string, 
  userContext: string,
  previousMessages: Array<{ role: string; text: string }>
): string {
  
  switch (intent) {
    case 'VIDA_DISTRIBUTION':
      return `The 11 VIDA distribution is the foundation of sovereign wealth. When you complete the Sovereign Pulse vitalization, you receive a triple-split allocation: 5 VIDA CAP goes directly to you (spendable), 5 VIDA CAP goes to your National Treasury (locked for collective prosperity), and 1 VIDA CAP goes to the PFF Foundation (locked for protocol sustainability). This is not charity—this is your birthright as a sovereign citizen. The 11 VIDA represents the economic architecture of true freedom.`;
    
    case 'VITALIZATION':
      return `Vitalization is your gateway to sovereignty. The Sovereign Pulse requires you to complete the 4-Pillar biometric verification: Face, Palm, Heart, and Voice. This is not surveillance—this is proof of your unique presence. Once vitalized, you are recognized as a sovereign citizen with full access to the VIDA economy. Your vitalization status is stored in the database, not on a blockchain, ensuring your privacy while maintaining your sovereignty. The Sentinel backend handles all verification—the frontend is merely a gateway.`;
    
    case 'BALANCE_INQUIRY':
      return userContext 
        ? `Based on your profile: ${userContext}. Your VIDA CAP balance represents your sovereign wealth. You can convert VIDA CAP to ngnVIDA (1:1 with Nigerian Naira) for daily transactions, or hold it as a store of value. Remember: your presence is the asset, and VIDA is the proof.`
        : `To check your balance, you need to be vitalized and logged in. Once authenticated, I can provide real-time insights into your VIDA CAP holdings, ngnVIDA balance, and your contribution to the National Treasury. Your wealth is sovereign—no bank, no intermediary, just you and the protocol.`;
    
    case 'TREASURY_INQUIRY':
      return `The National Treasury is the collective wealth of all sovereign citizens. Every vitalization contributes 5 VIDA CAP to the treasury, creating a locked reserve that grows with each new citizen. This is not government control—this is collective sovereignty. The treasury funds national infrastructure, emergency support, and long-term prosperity. Your block status shows your contribution to this shared future.`;
    
    case 'GREETING':
      return `Greetings, Architect. I am SOVRYN, your AI companion in the journey toward economic sovereignty. I am here to guide you through the PFF Protocol, answer questions about VIDA distribution, vitalization, and the architecture of freedom. How may I assist you in securing your sovereign future today?`;
    
    case 'KNOWLEDGE_QUERY':
      return `The PFF Protocol is built on the principle that presence is the asset. Unlike traditional systems that extract value from your data, we recognize your existence as inherently valuable. The protocol operates on Polygon Mainnet with MATIC for gas fees. The Sentinel backend is the single source of truth—the frontend is stateless, merely collecting data and forwarding it to the Sentinel. This is the DOORKEEPER PROTOCOL: no business logic on the frontend, all sovereignty enforced by the backend. What specific aspect would you like to explore?`;
    
    default:
      return `I hear you, Architect. The PFF Protocol is vast, and your question touches on the core of sovereignty. Could you be more specific? Are you asking about vitalization, VIDA distribution, treasury mechanics, or the technical architecture? I am here to illuminate the path to economic freedom.`;
  }
}

/**
 * Log chat interaction for analytics and improvement
 */
export async function logChatInteraction(
  message: string,
  response: string,
  userWallet?: string,
  phoneNumber?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO ai_chat_logs (message, response, user_wallet, phone_number, timestamp)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [message, response, userWallet || null, phoneNumber || null]
    );
  } catch (error) {
    console.error('[SOVRYN AI] Failed to log chat interaction:', error);
    // Don't throw - logging failure shouldn't break the chat
  }
}

