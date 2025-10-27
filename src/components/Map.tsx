import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import WKT from 'ol/format/WKT';
import { useEffect, useRef, useState } from "react";

import 'ol/ol.css'
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

interface MapComponentProps {
    coordsWKT: null|string
}

export const MapComponent = ({coordsWKT} : MapComponentProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<Map|null>(null);
 
    useEffect(() => {
        if (!ref.current) return;

        const mapObject: Map = new Map({
            view: new View({
                projection: 'EPSG:3857',
                center: [2191602, 9461681],
                zoom: 4
            }),
            layers: [new TileLayer({
                source: new OSM()
            })]
        })

        mapObject.setTarget(ref.current);
        setMap(mapObject);

        return () => {
            setMap(null);
            mapObject.setTarget(undefined);
            mapObject.dispose();
        }
    }, [ref]);

    useEffect(() => {
        if (!map || !coordsWKT) return;


        const format = new WKT();

        const feature = format.readFeature(coordsWKT, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });

        console.log('feature', feature)

        const vector = new VectorLayer({
            source: new VectorSource({
                features: [feature],
            })
        });

        map.addLayer(vector);

        return () => {
            map.removeLayer(vector);
        }

    }, [coordsWKT, map]);

    return <div ref={ref} style={{width: '500px', height: '100%'}}/>;
}