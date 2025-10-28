import { describe, test, expect } from 'bun:test';
import { XJTU } from '../../src/index.js';

describe('XJTU', () => {
  test('should create instance with credentials', () => {
    const xjtu = new XJTU({
      netid: 'test',
      password: 'test'
    });

    expect(xjtu).toBeDefined();
  });

  test('should create instance without credentials', () => {
    const xjtu = new XJTU();

    expect(xjtu).toBeDefined();
  });

  test('should generate device ID', () => {
    const xjtu = new XJTU();
    // 这里可以添加对设备ID生成的测试
    expect(xjtu).toBeDefined();
  });

  test('should create instance with token credentials', () => {
    const xjtu = new XJTU({
      idToken: 'test-id-token',
      refreshToken: 'test-refresh-token'
    });

    expect(xjtu).toBeDefined();
    expect(xjtu.getIdToken()).toBe('test-id-token');
  });

  test('should create instance with token credentials without refreshToken', () => {
    const xjtu = new XJTU({
      idToken: 'test-id-token'
    });

    expect(xjtu).toBeDefined();
    expect(xjtu.getIdToken()).toBe('test-id-token');
  });

  test('should set tokens after initialization', () => {
    const xjtu = new XJTU();

    xjtu.setTokens('new-id-token', 'new-refresh-token');

    expect(xjtu.getIdToken()).toBe('new-id-token');
    expect(xjtu.getRefreshToken()).toBe('new-refresh-token');
  });

  test('should set tokens without refreshToken', () => {
    const xjtu = new XJTU();

    xjtu.setTokens('new-id-token');

    expect(xjtu.getIdToken()).toBe('new-id-token');
    expect(() => xjtu.getRefreshToken()).toThrow('没有 refreshToken');
  });

  test('should throw error when getting idToken without login', () => {
    const xjtu = new XJTU();

    expect(() => xjtu.getIdToken()).toThrow('请先登录');
  });
});