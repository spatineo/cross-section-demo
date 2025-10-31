import _ from "lodash";
import type { LineSegment } from "../types";


interface SortedLineSegment extends LineSegment {
    closestDistanceSq: number;
}

const calculateDistances = (input: LineSegment[]) : SortedLineSegment[] => {
    const ret = input.map((segmentA): SortedLineSegment => {
        const others = input.filter(x => x !== segmentA).map(segmentB => {
            return {
                segment: segmentB,
                distanceToASq: (segmentA.mid[0]-segmentB.mid[0])**2 + (segmentA.mid[1]-segmentB.mid[1])**2 
            }
        });
        others.sort((a,b) => a.distanceToASq - b.distanceToASq);

        return {
            ...segmentA,
            closestDistanceSq: others[0].distanceToASq
        }
    });

    ret.sort((a,b) => a.closestDistanceSq - b.closestDistanceSq);

    return ret;
}

export const cullPointsUniformGrid = (points: LineSegment[]): LineSegment[] => {
    if (points.length === 0) {
        return [];
    }

    const gridSize = [6, 4];

    const grid : LineSegment[][]= [];

    // Find min/max values for both axises, +.01 == Ugly hack to make sure segments fall into grid cellls
    const rangeX = { min: _.min(points.map(p => p.mid[0]))!, max: _.max(points.map(p => p.mid[0]))! + .01 }
    const rangeY = { min: _.min(points.map(p => p.mid[1]))!, max: _.max(points.map(p => p.mid[1]))! + .01}

    // Bin'em
    points.forEach((p) => {
        const xBin = Math.floor( (p.mid[0]-rangeX.min)/(rangeX.max - rangeX.min) * gridSize[0] )
        const yBin = Math.floor( (p.mid[1]-rangeY.min)/(rangeY.max - rangeY.min) * gridSize[1] )

        const cell = grid[xBin + yBin * gridSize[0] ] || (grid[xBin + yBin * gridSize[0] ] = [])

        cell.push(p)
    });

    const ret : LineSegment[] = [];
    grid.forEach((segments) => {
        if (!segments) return;

        // Trivial case
        if (segments.length === 1) {
            return segments[0];
        }

        // First remove all duplicates - if there are multiple LineSegments at the same point, none of them are useful to the user
        const uniquePoints = calculateDistances(segments).filter(ls => ls.closestDistanceSq > 0);

        // If none left, do nothing
        if (uniquePoints.length === 0) return;

        // Select a random point from the remaining items in the cell
        ret.push(uniquePoints[Math.floor(Math.random() * uniquePoints.length)])
    });

    return ret;
}

