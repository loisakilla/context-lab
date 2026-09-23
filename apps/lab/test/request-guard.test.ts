import { describe, expect, it } from 'vitest';
import { clientAddress, createRateLimiter, readJsonObject, sameOrigin, sendsJson } from '../src/lib/request-guard';

function request(headers: Record<string, string>, body?: string): Request {
  return new Request('http://127.0.0.1:3000/api/check', { method: 'POST', headers, ...(body !== undefined ? { body } : {}) });
}

describe('защита API лаборатории', () => {
  it('пропускает запрос без Origin и запрос со своего сайта', () => {
    expect(sameOrigin(request({ host: 'lab.example' }))).toBe(true);
    expect(sameOrigin(request({ host: 'lab.example', origin: 'https://lab.example' }))).toBe(true);
  });

  it('отклоняет запрос с чужого сайта и с испорченным Origin', () => {
    expect(sameOrigin(request({ host: 'lab.example', origin: 'https://evil.example' }))).toBe(false);
    expect(sameOrigin(request({ host: 'localhost:3000', origin: 'http://localhost:4000' }))).toBe(false);
    expect(sameOrigin(request({ host: 'lab.example', origin: 'null' }))).toBe(false);
  });

  it('берёт адрес клиента из первого x-forwarded-for', () => {
    expect(clientAddress(request({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
    expect(clientAddress(request({}))).toBe('local');
  });

  it('узнаёт JSON только по заголовку Content-Type', () => {
    expect(sendsJson(request({ 'content-type': 'application/json; charset=utf-8' }))).toBe(true);
    expect(sendsJson(request({ 'content-type': 'text/plain' }))).toBe(false);
  });

  it('пропускает не больше лимита запросов за окно и сбрасывает счёт в новом окне', () => {
    const limited = createRateLimiter(2, 1000);
    expect([limited('a', 0), limited('a', 10), limited('a', 20)]).toEqual([false, false, true]);
    expect(limited('b', 20)).toBe(false);
    expect(limited('a', 1000)).toBe(false);
  });

  it('читает только JSON-объект, а null, массив и мусор отвергает', async () => {
    await expect(readJsonObject(request({}, '{"code":"x"}'))).resolves.toEqual({ code: 'x' });
    await expect(readJsonObject(request({}, 'null'))).resolves.toBeNull();
    await expect(readJsonObject(request({}, '[1]'))).resolves.toBeNull();
    await expect(readJsonObject(request({}, '{'))).resolves.toBeNull();
  });
});
