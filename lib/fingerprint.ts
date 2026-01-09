/**
 * Advanced Fingerprinting System
 * Client-side fingerprint collection
 */

import type { FingerprintData } from './types';

/**
 * Generate Canvas Fingerprint
 */
export function generateCanvasFingerprint(): string {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        canvas.width = 200;
        canvas.height = 50;

        // Draw text with specific font
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);

        ctx.fillStyle = '#069';
        ctx.fillText('Browser Fingerprint 🔒', 2, 15);

        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Canvas Fingerprinting', 4, 17);

        // Get canvas data and hash it
        const dataURL = canvas.toDataURL();
        return hashString(dataURL);
    } catch (e) {
        return '';
    }
}

/**
 * Get WebGL Fingerprint
 */
export function getWebGLFingerprint(): { vendor: string; renderer: string; hash: string } {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

        if (!gl) {
            return { vendor: '', renderer: '', hash: '' };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

        const hash = hashString(`${vendor}|${renderer}`);

        return { vendor, renderer, hash };
    } catch (e) {
        return { vendor: '', renderer: '', hash: '' };
    }
}

/**
 * Get Audio Fingerprint
 */
export function getAudioFingerprint(): string {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return '';

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

        gainNode.gain.value = 0; // Mute
        oscillator.type = 'triangle';
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(0);

        const data = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(data);

        oscillator.stop();
        context.close();

        return hashString(data.toString());
    } catch (e) {
        return '';
    }
}

/**
 * Get battery information
 */
export async function getBatteryInfo(): Promise<{ charging: boolean; level: number } | null> {
    try {
        if ('getBattery' in navigator) {
            const battery = await (navigator as any).getBattery();
            return {
                charging: battery.charging,
                level: battery.level,
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Get available fonts
 */
export function getAvailableFonts(): string[] {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
        'Arial', 'Verdana', 'Courier New', 'Georgia', 'Times New Roman',
        'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Arial Black', 'Tahoma'
    ];

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [];

    const detected: string[] = [];

    for (const font of testFonts) {
        let detected_font = false;
        for (const baseFont of baseFonts) {
            context.font = `72px ${baseFont}`;
            const baseWidth = context.measureText('mmmmmmmmmmlli').width;

            context.font = `72px ${font}, ${baseFont}`;
            const testWidth = context.measureText('mmmmmmmmmmlli').width;

            if (baseWidth !== testWidth) {
                detected_font = true;
                break;
            }
        }
        if (detected_font) {
            detected.push(font);
        }
    }

    return detected;
}

/**
 * Get media devices count
 */
export async function getMediaDevices(): Promise<{ audioInput: number; audioOutput: number; videoInput: number }> {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return { audioInput: 0, audioOutput: 0, videoInput: 0 };
        }

        const devices = await navigator.mediaDevices.enumerateDevices();

        return {
            audioInput: devices.filter(d => d.kind === 'audioinput').length,
            audioOutput: devices.filter(d => d.kind === 'audiooutput').length,
            videoInput: devices.filter(d => d.kind === 'videoinput').length,
        };
    } catch (e) {
        return { audioInput: 0, audioOutput: 0, videoInput: 0 };
    }
}

/**
 * Collect complete fingerprint data
 */
export async function collectFingerprint(): Promise<FingerprintData> {
    const webgl = getWebGLFingerprint();
    const battery = await getBatteryInfo();
    const mediaDevices = await getMediaDevices();

    const fingerprint: FingerprintData = {
        // Canvas
        canvasHash: generateCanvasFingerprint(),

        // WebGL
        webglVendor: webgl.vendor,
        webglRenderer: webgl.renderer,
        webglHash: webgl.hash,

        // Screen
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,

        // Browser
        platform: navigator.platform,
        language: navigator.language,
        languages: Array.from(navigator.languages || [navigator.language]),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),

        // Hardware
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory,

        // Battery
        batteryCharging: battery?.charging,
        batteryLevel: battery?.level,

        // Audio
        audioHash: getAudioFingerprint(),

        // Fonts
        fonts: getAvailableFonts(),

        // Plugins
        plugins: Array.from(navigator.plugins || []).map(p => p.name),

        // Touch
        touchSupport: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints || 0,

        // Media Devices
        mediaDevices,
    };

    return fingerprint;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}
