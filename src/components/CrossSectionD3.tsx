import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";
import { uniq } from "lodash";
import { generateExampleTrajectoryCovJSON } from "../data/exampleData";
import type { FeatureCollection, MultiPolygon } from "geojson";
import type { LineSegment } from "../types";
import { cullPoints } from "../util/GreedyIterativeCulling";

interface Value {
    value: number;
    [id: string]: number|string;
}

interface CrossSectionData {
    values: Value[],
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

    const dataGrids : CrossSectionData = useMemo(() => {
        const parameterName = Object.keys(data.parameters)[0];

        const values : Value[] = data.coverages.flatMap((cov: any) => {
            const range = cov.ranges[parameterName];
            // TODO: instead of `composite`, this should be relative to the axisNames in range
            const axes = cov.domain.axes.composite;

            return range.values.map((value: number|null, idx: number) => {
                return {
                    value,
                    ...axes.coordinates.reduce((memo: { [id: string]: string|number }, axis: string, axisIdx: number) => ({
                        ...memo,
                        [axis]: axes.values[idx][axisIdx]
                    }), {} as { [id: string]: string|number })
                };
            }).filter((v: { [id: string]: string|number }) => v.value !==null) as Value[];
        });

        const width = uniq(values.map(v => v.x)).length;
        const height = uniq(values.map(v => v.z)).length;

        // NOTE! The response from FMI is already sorted in the order we assume the data should be sorted
        const grid = values.map(v => v.value);

        const contours = d3.contours()
            .size([width, height])
            .smooth(true);
        
        const polygons = contours(grid);

        return {
            values,
            gridWidth: width,
            gridHeight: height,
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

        const culledLineSegments = cullPoints(allLineSegments, 1.5);
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

   return <svg width={width} height={height} ref={ref} style={isLoading ? {'filter': 'saturate(0)'} : {}}/>;
};