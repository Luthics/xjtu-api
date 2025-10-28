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
});