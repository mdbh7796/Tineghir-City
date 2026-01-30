const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
    
    // 1. Content API
    it('GET /api/content should return status 200', async () => {
        const res = await request(app).get('/api/content');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('hero_title');
    });

    // 2. Attractions API
    it('GET /api/attractions should return a list', async () => {
        const res = await request(app).get('/api/attractions');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    // 3. Security Headers (Helmet)
    it('Should have security headers', async () => {
        const res = await request(app).get('/api/content');
        expect(res.headers).toHaveProperty('content-security-policy');
        expect(res.headers).toHaveProperty('x-frame-options');
    });

    // 4. Rate Limiter (Status check only)
    it('GET /api/ should be accessible under limit', async () => {
        const res = await request(app).get('/api/content');
        expect(res.statusCode).not.toEqual(429);
    });
});
