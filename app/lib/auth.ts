import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthPayload {
  userId: number;
  username: string;
  clubId: string;
  role: string;
}

export async function verifyAuth(req: Request): Promise<AuthPayload> {
  console.log('verifyAuth - Starting verification');
  const authorization = req.headers.get('authorization');
  console.log(`verifyAuth - Authorization header: ${authorization ? 'Present' : 'Missing'}`);

  if (!authorization) {
    console.log('verifyAuth - No authorization header');
    throw new Error('No authorization header');
  }

  const token = authorization.replace('Bearer ', '');
  console.log(`verifyAuth - Token: ${token.substring(0, 10)}...`);

  try {
    console.log('verifyAuth - Verifying token');
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    console.log(`verifyAuth - Token verified, decoded payload: ${JSON.stringify(decoded)}`);
    return decoded;
  } catch (error) {
    console.error('verifyAuth - Invalid token:', error);
    throw new Error('Invalid token');
  }
} 