/**
 * Behavioral Tracking System
 * Tracks user behavior to detect bots
 */

import type { BehavioralData } from './types';

class BehavioralTracker {
    private mouseMovements = 0;
    private mouseClicks = 0;
    private mouseDistance = 0;
    private lastMouseX = 0;
    private lastMouseY = 0;

    private scrollEvents = 0;
    private scrollDistance = 0;
    private lastScrollY = 0;

    private keyPresses = 0;
    private touchEvents = 0;
    private focusChanges = 0;

    private startTime: number;
    private timeToFirstInteraction?: number;
    private hasInteracted = false;

    constructor() {
        this.startTime = Date.now();
        this.initListeners();
    }

    private initListeners(): void {
        // Mouse movement
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });

        // Mouse clicks
        document.addEventListener('click', this.handleClick.bind(this), { passive: true });

        // Scroll
        document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

        // Keyboard
        document.addEventListener('keydown', this.handleKeyPress.bind(this), { passive: true });

        // Touch
        document.addEventListener('touchstart', this.handleTouch.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouch.bind(this), { passive: true });

        // Focus/Blur
        window.addEventListener('focus', this.handleFocusChange.bind(this), { passive: true });
        window.addEventListener('blur', this.handleFocusChange.bind(this), { passive: true });
    }

    private handleMouseMove(e: MouseEvent): void {
        this.mouseMovements++;

        if (this.lastMouseX !== 0 || this.lastMouseY !== 0) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.mouseDistance += Math.sqrt(dx * dx + dy * dy);
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.recordFirstInteraction();
    }

    private handleClick(): void {
        this.mouseClicks++;
        this.recordFirstInteraction();
    }

    private handleScroll(): void {
        this.scrollEvents++;

        const currentY = window.scrollY;
        if (this.lastScrollY !== 0) {
            this.scrollDistance += Math.abs(currentY - this.lastScrollY);
        }
        this.lastScrollY = currentY;

        this.recordFirstInteraction();
    }

    private handleKeyPress(): void {
        this.keyPresses++;
        this.recordFirstInteraction();
    }

    private handleTouch(): void {
        this.touchEvents++;
        this.recordFirstInteraction();
    }

    private handleFocusChange(): void {
        this.focusChanges++;
    }

    private recordFirstInteraction(): void {
        if (!this.hasInteracted) {
            this.timeToFirstInteraction = Date.now() - this.startTime;
            this.hasInteracted = true;
        }
    }

    public getData(): BehavioralData {
        return {
            mouseMovements: this.mouseMovements,
            mouseClicks: this.mouseClicks,
            mouseDistance: Math.round(this.mouseDistance),
            scrollEvents: this.scrollEvents,
            scrollDistance: Math.round(this.scrollDistance),
            timeToFirstInteraction: this.timeToFirstInteraction,
            timeOnPage: Date.now() - this.startTime,
            keyPresses: this.keyPresses,
            touchEvents: this.touchEvents,
            pageVisibility: document.visibilityState === 'visible',
            focusChanges: this.focusChanges,
        };
    }

    public destroy(): void {
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('click', this.handleClick.bind(this));
        document.removeEventListener('scroll', this.handleScroll.bind(this));
        document.removeEventListener('keydown', this.handleKeyPress.bind(this));
        document.removeEventListener('touchstart', this.handleTouch.bind(this));
        document.removeEventListener('touchmove', this.handleTouch.bind(this));
        window.removeEventListener('focus', this.handleFocusChange.bind(this));
        window.removeEventListener('blur', this.handleFocusChange.bind(this));
    }
}

// Singleton instance
let tracker: BehavioralTracker | null = null;

/**
 * Start tracking behavioral data
 */
export function startBehavioralTracking(): void {
    if (!tracker) {
        tracker = new BehavioralTracker();
    }
}

/**
 * Get current behavioral data
 */
export function getBehavioralData(): BehavioralData | null {
    return tracker?.getData() || null;
}

/**
 * Stop tracking and cleanup
 */
export function stopBehavioralTracking(): void {
    if (tracker) {
        tracker.destroy();
        tracker = null;
    }
}

/**
 * Analyze behavioral data for bot detection
 */
export function analyzeBehavior(data: BehavioralData): {
    isSuspicious: boolean;
    score: number;
    reasons: string[];
} {
    const reasons: string[] = [];
    let suspicionScore = 0;

    // No mouse movement (30 points)
    if (data.mouseMovements === 0 && data.timeOnPage > 1000) {
        reasons.push('No mouse movement detected');
        suspicionScore += 30;
    }

    // Instant interactions (25 points)
    if (data.timeToFirstInteraction !== undefined && data.timeToFirstInteraction < 100) {
        reasons.push('Suspiciously fast first interaction');
        suspicionScore += 25;
    }

    // No scrolling on long page (20 points)
    if (document.body.scrollHeight > window.innerHeight * 2 && data.scrollEvents === 0 && data.timeOnPage > 2000) {
        reasons.push('No scrolling on long page');
        suspicionScore += 20;
    }

    // Unnatural mouse distance (15 points)
    if (data.mouseMovements > 100 && data.mouseDistance < 100) {
        reasons.push('Unnatural mouse movement pattern');
        suspicionScore += 15;
    }

    // No interactions at all (40 points)
    if (
        data.mouseMovements === 0 &&
        data.mouseClicks === 0 &&
        data.scrollEvents === 0 &&
        data.keyPresses === 0 &&
        data.touchEvents === 0 &&
        data.timeOnPage > 2000
    ) {
        reasons.push('Zero user interactions detected');
        suspicionScore += 40;
    }

    // Very fast page loading (20 points)
    if (data.timeOnPage < 500 && data.mouseMovements > 0) {
        reasons.push('Suspiciously fast page interactions');
        suspicionScore += 20;
    }

    return {
        isSuspicious: suspicionScore >= 40,
        score: Math.min(suspicionScore, 100),
        reasons,
    };
}
