import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";
import { uniq } from "lodash";
import { generateExampleTrajectoryCovJSON } from "../data/exampleData";
import type { FeatureCollection } from "geojson";

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
}

export const CrossSectionD3 = ({data, isLoading} : CrossSectionD3Props) => {
    const ref = useRef<SVGSVGElement>(null);

    const dataGrids : CrossSectionData = useMemo(() => {
        const parameterName = Object.keys(data.parameters)[0];

        const values : Value[] = data.coverages.flatMap((cov) => {
            const range = cov.ranges[parameterName];
            // TODO: instead of `composite`, this should be relative to the axisNames in range
            const axes = cov.domain.axes.composite;

            return range.values.map((value, idx) => {
                return {
                    value,
                    ...axes.coordinates.reduce((memo, axis, axisIdx) => ({
                        ...memo,
                        [axis]: axes.values[idx][axisIdx]
                    }), {} as { [id: string]: string|number })
                };
            }).filter(v => v.value !==null) as Value[];
        });

        values.sort((a, b) => {
            if (a.z! < b.z!) return -1;
            if (a.z! > b.z!) return 1;
            if (a.x! < b.x!) return -1;
            if (a.x! > b.x!) return 1;
            return 0;
        });

        const width = uniq(values.map(v => v.x)).length;
        const height = uniq(values.map(v => v.z)).length;

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

        const margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

        ref.current.innerHTML = '';
        const svg = d3
            .select(ref.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        const myColor = d3.scaleSequential()
            .interpolator(d3.interpolateBlues)
            .domain([d3.min(dataGrids.grid)!, d3.max(dataGrids.grid)!])

        dataGrids.featureCollection.features.forEach(feature => {
            svg.append("path")
                .datum(feature)
                .style("stroke", "none")
                .style("fill", (x) => myColor(x.properties!.value))
                .attr("transform", `scale(${width/dataGrids.gridWidth} ${height/dataGrids.gridHeight})`)
                .attr("d", d3.geoPath())
        })

    }, [ref, dataGrids]);

   return <svg width={460} height={400} ref={ref} style={isLoading ? {'filter': 'saturate(0)'} : {}}/>;
};