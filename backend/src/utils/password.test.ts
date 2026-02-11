import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('Password Utils', () => {
  it('should hash and verify password correctly', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    
    const isValid = await verifyPassword(hash, password);
    expect(isValid).toBe(true);
  });

  it('should reject invalid password', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword(hash, 'WrongPassword');
    expect(isValid).toBe(false);
  });
});
