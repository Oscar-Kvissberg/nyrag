import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthPayload {
  userId: number;
  username: string;
  clubId: string;
  role: string;
}

export async function verifyAuth(req: Request): Promise<AuthPayload> {
  const authorization = req.headers.get('authorization');

  if (!authorization) {
    throw new Error('No authorization header');
  }

  const token = authorization.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch {
    throw new Error('Invalid token');
  }
} 