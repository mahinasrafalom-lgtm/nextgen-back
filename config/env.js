const requiredInProduction = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL', 'ADMIN_URL'];

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientOrigins: [process.env.CLIENT_URL, process.env.ADMIN_URL, ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:5174'] : [])]
    .filter(Boolean)
    .flatMap((origins) => origins.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === 'production'
};

export function validateEnvironment() {
  if (!env.isProduction) return;
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required production environment variable(s): ${missing.join(', ')}`);
  if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters in production.');
}
