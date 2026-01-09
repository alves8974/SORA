import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
    try {
        // Test basic KV operations
        const testKey = 'test:connection';
        const testValue = { timestamp: Date.now(), test: true };

        // Try to set and get
        await kv.set(testKey, testValue);
        const retrieved = await kv.get(testKey);

        // Clean up
        await kv.del(testKey);

        return NextResponse.json({
            success: true,
            message: 'KV connection successful!',
            retrieved,
            env: {
                hasKvUrl: !!process.env.KV_REST_API_URL,
                hasKvToken: !!process.env.KV_REST_API_TOKEN,
                hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
                hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
                hasRedisUrl: !!process.env.REDIS_URL,
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error),
            env: {
                hasKvUrl: !!process.env.KV_REST_API_URL,
                hasKvToken: !!process.env.KV_REST_API_TOKEN,
                hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
                hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
                hasRedisUrl: !!process.env.REDIS_URL,
            }
        }, { status: 500 });
    }
}
