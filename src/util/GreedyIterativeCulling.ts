import type { LineSegment } from "../types";

/**
 * Culls a set of points so that no two retained points are closer than the threshold.
 * It prioritizes points with a higher score.
 *
 * @param points - The initial array of points.
 * @param threshold - The minimum required separation distance.
 * @returns An array of culled points.
 */
export const cullPoints = (points: LineSegment[], threshold: number): LineSegment[] => {
    // 1. Sort the points by score in descending order (Greedy step).
    // We want to process the most important points first to ensure they are kept.

    const sortedPoints = points
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)

    const culledPoints: LineSegment[] = [];
    const discardIndices = new Set<LineSegment>();

    // The squared threshold is used to avoid repeated Math.sqrt() calls,
    // which makes the distance check faster.
    const thresholdSq = threshold * threshold;

    for (let i = 0; i < sortedPoints.length; i++) {
        const p1 = sortedPoints[i];

        // If this point has already been marked for discard by a higher-scoring neighbor, skip it.
        if (discardIndices.has(p1)) {
            continue;
        }

        // 2. Keep the current high-scoring point.
        culledPoints.push(p1);

        // 3. Mark all its close neighbors (which have a lower score because of the initial sort) for discard.
        for (let j = i + 1; j < sortedPoints.length; j++) {
            const p2 = sortedPoints[j];
            
            // Note: We use the ID to ensure we mark the correct original point,
            // even if the points array was sorted.
            if (discardIndices.has(p2)) {
                continue;
            }

            // Using squared distance for efficiency: d^2 < T^2
            const dx = p1.mid[0] - p2.mid[0];
            const dy = p1.mid[1] - p2.mid[1];
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq < thresholdSq) {
                // p2 is too close to p1 (which has a higher score), so discard p2.
                discardIndices.add(p2);
            }
        }
    }

    return culledPoints;
}
