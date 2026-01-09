import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Drop and recreate visit_logs table with correct schema
        await sql`DROP TABLE IF EXISTS click_logs`;
        await sql`DROP TABLE IF EXISTS visit_logs`;

        // Create visit_logs table with ALL required columns
        await sql`
            CREATE TABLE visit_logs (
                id SERIAL PRIMARY KEY,
                campaign_id VARCHAR(255) NOT NULL,
                ip_hash VARCHAR(100),
                user_agent TEXT,
                referer TEXT,
                country VARCHAR(100),
                is_bot BOOLEAN DEFAULT FALSE,
                confidence INTEGER DEFAULT 0,
                probability FLOAT DEFAULT 0,
                page_served VARCHAR(20),
                detection_details JSONB,
                visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create click_logs table
        await sql`
            CREATE TABLE click_logs (
                id SERIAL PRIMARY KEY,
                visit_id VARCHAR(255),
                url TEXT,
                referrer TEXT,
                clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create indexes for performance
        await sql`CREATE INDEX idx_visit_logs_campaign_id ON visit_logs(campaign_id)`;
        await sql`CREATE INDEX idx_visit_logs_visited_at ON visit_logs(visited_at)`;
        await sql`CREATE INDEX idx_visit_logs_is_bot ON visit_logs(is_bot)`;
        await sql`CREATE INDEX idx_click_logs_visit_id ON click_logs(visit_id)`;

        return NextResponse.json({
            success: true,
            message: 'Database tables created successfully! Tables: visit_logs, click_logs'
        });
    } catch (error) {
        console.error('Setup error:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
