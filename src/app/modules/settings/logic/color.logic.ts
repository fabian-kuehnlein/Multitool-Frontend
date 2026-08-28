export interface RgbColor {
    r: number;
    g: number;
    b: number;
}

export interface HslColor {
    h: number;
    s: number;
    l: number;
}

export const CANDIDATE_PRESET_COLORS: string[] = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#64748b',
    '#84cc16',
    '#f97316',
    '#a855f7',
    '#f43f5e',
    '#6366f1',
    '#14b8a6',
    '#0ea5e9',
    '#eab308',
    '#d946ef',
    '#2dd4bf',
];

export function parseHexColor(hex: string): RgbColor | null {
    if (!hex) return null;
    let clean = hex.trim().replace(/^#/, '');
    if (clean.length === 3) {
        clean = clean
            .split('')
            .map((c) => c + c)
            .join('');
    }
    if (clean.length !== 6) return null;
    const num = parseInt(clean, 16);
    if (isNaN(num)) return null;
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;

    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rf:
                h = (gf - bf) / d + (gf < bf ? 6 : 0);
                break;
            case gf:
                h = (bf - rf) / d + 2;
                break;
            case bf:
                h = (rf - gf) / d + 4;
                break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

export function calculateColorDistance(hex1: string, hex2: string): number {
    const rgb1 = parseHexColor(hex1);
    const rgb2 = parseHexColor(hex2);
    if (!rgb1 || !rgb2) return 999;

    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;

    // Perceptually weighted RGB Euclidean distance
    const rgbDist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);

    const hsl1 = rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
    const hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);

    // Hue distance (0..180 deg)
    let hueDiff = Math.abs(hsl1.h - hsl2.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;

    return rgbDist + hueDiff * 1.5;
}

export const MIN_COLOR_DISTANCE_THRESHOLD = 130;

export function getDistinctPresetColors(
    existingColors: string[],
    currentColor?: string,
    count = 8,
): string[] {
    const normCurrent = currentColor?.trim().toLowerCase() ?? null;

    const validExisting = existingColors
        .filter((c) => !!c)
        .map((c) => c.trim().toLowerCase())
        .filter((c) => c !== normCurrent);

    if (validExisting.length === 0) {
        const base = CANDIDATE_PRESET_COLORS.slice(0, count);
        if (normCurrent && !base.includes(normCurrent)) {
            base[base.length - 1] = currentColor!;
        }
        return base;
    }

    // Score candidates by their minimum distance to any existing color
    const scored = CANDIDATE_PRESET_COLORS.map((candidate) => {
        const minDistance = Math.min(
            ...validExisting.map((existing) =>
                calculateColorDistance(candidate, existing),
            ),
        );
        return { candidate, minDistance };
    });

    scored.sort((a, b) => b.minDistance - a.minDistance);

    // Only suggest colors that are far enough away from every existing category color.
    // If not enough remain (e.g. many categories already exist), fall back to the closest matches.
    let pool = scored.filter((s) => s.minDistance >= MIN_COLOR_DISTANCE_THRESHOLD);
    if (pool.length < count) {
        pool = scored;
    }

    const result = pool.slice(0, count).map((s) => s.candidate);

    // If editing a category, ensure currentColor is present in the list
    if (normCurrent && !result.some((c) => c.toLowerCase() === normCurrent)) {
        result[result.length - 1] = currentColor!;
    }

    return result;
}
