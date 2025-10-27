import { Feature, Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import {defaults as defaultInteractions} from 'ol/interaction/defaults';
import WKT from 'ol/format/WKT';
import { useEffect, useMemo, useRef, useState } from "react";
import Translate from 'ol/interaction/Translate';

import 'ol/ol.css'
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { unByKey } from "ol/Observable";
import { debounce } from "lodash";
import type { EventsKey } from "ol/events";

interface MapComponentProps {
    coordsWKT: null|string,
    setCoordsWKT: (wkt: string) => void;
}

export const MapComponent = ({coordsWKT, setCoordsWKT} : MapComponentProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [translating, setTranslating] = useState(false);
    const [vectorSource, setVectorSource] = useState<VectorSource|null>(null);

    const debouncedSetCoords = useMemo(() => {
        return debounce((feature: Feature) => {
            const format = new WKT();
            const wkt = format.writeFeature(feature, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
            });

            setCoordsWKT(wkt);
        }, 100, { maxWait: 250 })
    }, [setCoordsWKT])

    useEffect(() => {
        if (!ref.current) return;

        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            zIndex: 1,
            style: {
                'stroke-color': '#ff000099',
                'stroke-width': 2.5
            }
        })

        const translate = new Translate({
            layers: [vectorLayer]
        });

        const mapObject: Map = new Map({
            interactions: defaultInteractions().extend([translate]),
            view: new View({
                projection: 'EPSG:3857',
                center: [2191602, 9461681],
                zoom: 4
            }),
            layers: [
                new TileLayer({
                    source: new OSM(),
                    zIndex: 0,
                }),
                vectorLayer
            ]
        });

        mapObject.setTarget(ref.current);
        setVectorSource(vectorSource);

        const evtKeys : EventsKey[] = [];

        evtKeys.push(translate.on('translating', (evt) => {
            debouncedSetCoords(evt.features.getArray()[0]);
        }));
        evtKeys.push(translate.on('translatestart', () => {
            setTranslating(true);
        }));
        evtKeys.push(translate.on('translateend', () => {
            setTranslating(false);
        }));

        return () => {
            evtKeys.forEach(unByKey);
            setVectorSource(null);
            mapObject.setTarget(undefined);
            mapObject.dispose();
        }
    }, [ref, debouncedSetCoords]);

    useEffect(() => {
        if (!vectorSource || !coordsWKT || translating) return;

        const format = new WKT();

        const feature = format.readFeature(coordsWKT, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });

        vectorSource.clear();
        vectorSource.addFeature(feature);

    }, [coordsWKT, translating, vectorSource, debouncedSetCoords]);

    return <div ref={ref} style={{width: '500px', height: '100%'}}/>;
}