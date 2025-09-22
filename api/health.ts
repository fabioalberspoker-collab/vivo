import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health check endpoint
 * Verifica se a API está funcionando
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Este endpoint aceita apenas requisições GET'
    });
  }

  res.status(200).json({
    status: 'ok',
    message: 'API do Vivo Contract Insight está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}