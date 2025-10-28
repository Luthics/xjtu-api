import { describe, test, expect } from 'bun:test';
import { rsaEncryptWithHeader } from '../../src/utils/rsa.js';

describe('RSA Utils', () => {
  test('should encrypt text with RSA header', () => {
    const plaintext = 'test_username';
    const encrypted = rsaEncryptWithHeader(plaintext);

    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted.startsWith('__RSA__')).toBe(true);
    expect(encrypted.length).toBeGreaterThan('__RSA__'.length);
  });

  test('should encrypt different texts to different results', () => {
    const text1 = 'user1';
    const text2 = 'user2';

    const encrypted1 = rsaEncryptWithHeader(text1);
    const encrypted2 = rsaEncryptWithHeader(text2);

    expect(encrypted1).not.toBe(encrypted2);
    expect(encrypted1.startsWith('__RSA__')).toBe(true);
    expect(encrypted2.startsWith('__RSA__')).toBe(true);
  });

  test('should handle empty string', () => {
    const encrypted = rsaEncryptWithHeader('');

    expect(encrypted).toBeDefined();
    expect(encrypted.startsWith('__RSA__')).toBe(true);
  });

  test('should handle special characters', () => {
    const specialText = 'test@xjtu.edu.cn_123';
    const encrypted = rsaEncryptWithHeader(specialText);

    expect(encrypted).toBeDefined();
    expect(encrypted.startsWith('__RSA__')).toBe(true);
  });
});