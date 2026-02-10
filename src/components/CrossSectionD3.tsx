import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateExampleTrajectoryCovJSON } from "../data/exampleData";
import type { FeatureCollection, MultiPolygon } from "geojson";
import type { LineSegment } from "../types";
import { cullPointsUniformGrid } from "../util/CullPointsCloseToEachOther";

interface CrossSectionData {
    gridWidth: number,
    gridHeight: number,
    grid: number[],
    featureCollection: FeatureCollection 
}

interface CrossSectionD3Props {
    data: ReturnType<typeof generateExampleTrajectoryCovJSON>,
    isLoading: boolean
    width: number
    height: number
}

export const CrossSectionD3 = ({data, isLoading, width, height} : CrossSectionD3Props) => {
    const ref = useRef<SVGSVGElement>(null);

    const [highlightedValue, setHighlightedValue] = useState<string|null>(null);

    const dataGrids : CrossSectionData = useMemo(() => {
        const parameterName = Object.keys(data.parameters)[0];

        const gridWidth = data.coverages[0].domain.axes.composite.values.length;
        const gridHeight = data.coverages.length;

        const grid = data.coverages.flatMap((cov: any) => {
            const range = cov.ranges[parameterName];
            return range.values;
        });

        const contours = d3.contours()
            .size([gridWidth, gridHeight])
            .smooth(true);
        
        const polygons = contours(grid);

        return {
            gridWidth,
            gridHeight,
            grid,
            featureCollection: {
                type: "FeatureCollection",
                features: polygons.map(poly => ({
                    type: "Feature",
                    geometry: poly,
                    properties: {
                        value: poly.value
                    }
                }))
            }
        };
    }, [data]);

    useEffect(() => {
        if (!ref.current) return;

        ref.current.innerHTML = '';
        const svg = d3
            .select(ref.current)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
        
        const myColor = d3.scaleSequential()
            .interpolator(d3.interpolateBlues)
            .domain([d3.min(dataGrids.grid)!, d3.max(dataGrids.grid)!])


        let allLineSegments : LineSegment[] = [];
        const xScale = width/dataGrids.gridWidth;
        const yScale = height/dataGrids.gridHeight;

        dataGrids.featureCollection.features.forEach(feature => {
            const path = d3.geoPath();

            const value = feature.properties!.value;

            svg.append("path")
                .datum(feature)
                .style("stroke", "none")
                .style("fill", myColor(value))
                .attr("transform", `scale(${xScale} ${yScale})`)
                .attr("d", path)
                .on('mouseover', function () {
                    setHighlightedValue(value);
                    d3.select(this).transition()
                        .duration(50)
                        .style('fill', '#944');
                })
                .on("mouseout", function () {
                    setHighlightedValue(null);
                    d3.select(this).transition()
                        .duration(50)
                        .style('fill', myColor(value));
                })

            const ringToLineSegments = (ring: number[][]): LineSegment[] => {
                const segments = [];
                for (let i = 1; i < ring.length; i++) {
                    segments.push({
                        a: ring[i-1],
                        b: ring[i],
                        mid: [ (ring[i-1][0] + ring[i][0])/2, (ring[i-1][1] + ring[i][1])/2 ],
                        angle: Math.atan2(ring[i-1][1] - ring[i][1], ring[i-1][0] - ring[i][0]),
                        value
                    })
                }
                return segments;
            }

            const lineSegments = ((feature.geometry as MultiPolygon).coordinates).flatMap(polygonPart => ringToLineSegments(polygonPart[0])) as LineSegment[]
            allLineSegments = [...allLineSegments, ...lineSegments];

        });

        const culledLineSegments = cullPointsUniformGrid(allLineSegments);

        svg
            .selectAll('line-segments')
            .data(culledLineSegments)
            .enter()
            .append("g")
                .style("transform", (segment) => `translate(${segment.mid[0] * xScale}px, ${segment.mid[1] * yScale}px)`)
            .append("text")
                .attr("width", "0px")
                .attr("height", "0px")
                .attr("font-size", "10px")
                .style("transform", (segment) => `rotate(${segment.angle + Math.PI}rad)`)
                .style("stroke", "#ffffff")
                .style("font-weight", "normal")
                .style("font-weight", "100")
                .text((segment) => `${segment.value}`)

    }, [ref, width, height, dataGrids]);


    return (
        <>
            <div style={{position: 'relative'}}>
                <svg width={width} height={height} ref={ref} style={isLoading ? {'filter': 'saturate(0)'} : {}}/>
                {highlightedValue !== null && <p style={{position: 'absolute', bottom: '5px', left: '10px', background: '#dbb', color: '#222', padding: '4px', borderRadius: '3px', fontSize: '80%', pointerEvents: 'none' }}>Value: {highlightedValue}</p>}
            </div>
        </>
    )
};