import { EasingCurve } from '../types';

/**
 * Apply easing curve to a progress value
 * @param progress - Value from 0 to 1
 * @param curveType - Type of easing curve to apply
 * @returns Eased value from 0 to 1
 */
export function applyEasingCurve(progress: number, curveType: EasingCurve): number {
    // Clamp progress to [0, 1]
    const t = Math.max(0, Math.min(1, progress));

    switch (curveType) {
        case 'linear':
            return t;

        case 'easeOutQuad':
            // Fast acceleration, gentle deceleration
            // f(t) = 1 - (1 - t)²
            return 1 - Math.pow(1 - t, 2);

        case 'easeInOutCubic':
            // Smooth S-curve, gradual start and end
            // f(t) = t < 0.5 ? 4t³ : 1 - (-2t + 2)³/2
            if (t < 0.5) {
                return 4 * Math.pow(t, 3);
            } else {
                return 1 - Math.pow(-2 * t + 2, 3) / 2;
            }

        case 'sigmoid':
            // Biological-like curve, smooth throughout
            // f(t) = 1 / (1 + e^(-k(t - 0.5)))
            const k = 10; // Steepness parameter
            return 1 / (1 + Math.exp(-k * (t - 0.5)));

        default:
            return t;
    }
}

/**
 * Calculate WPM at any point during ramping
 * @param startWPM - Starting WPM (typically 60% of target)
 * @param targetWPM - Target WPM to reach
 * @param elapsedTime - Time elapsed since ramp start (ms)
 * @param totalDuration - Total ramp duration (ms)
 * @param easingCurve - Easing curve type
 * @returns Current WPM
 */
export function getCurrentWPMDuringRamp(
    startWPM: number,
    targetWPM: number,
    elapsedTime: number,
    totalDuration: number,
    easingCurve: EasingCurve
): number {
    if (elapsedTime >= totalDuration) {
        return targetWPM;
    }

    const progress = elapsedTime / totalDuration;
    const eased = applyEasingCurve(progress, easingCurve);

    return startWPM + (targetWPM - startWPM) * eased;
}

/**
 * Check if ramping is complete
 * @param elapsedTime - Time elapsed since ramp start (ms)
 * @param totalDuration - Total ramp duration (ms)
 * @returns True if ramping is complete
 */
export function isRampingComplete(elapsedTime: number, totalDuration: number): boolean {
    return elapsedTime >= totalDuration;
}
