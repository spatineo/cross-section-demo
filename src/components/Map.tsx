import { Feature, Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import {defaults as defaultInteractions} from 'ol/interaction/defaults';
import WKT from 'ol/format/WKT';
import { useEffect, useMemo, useRef, useState } from "react";
import Translate from 'ol/interaction/Translate';
import Draw from 'ol/interaction/Draw';

import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { unByKey } from "ol/Observable";
import { debounce } from "lodash";
import type { EventsKey } from "ol/events";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import { MultiPoint, type LineString } from "ol/geom";

import 'ol/ol.css'

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
            style: (feature) => {
                return [
                    new Style({
                        stroke: new Stroke({
                            color: '#ff000099',
                            width: 2.5
                        })
                    }),
                    new Style({
                        geometry: new MultiPoint((feature.getGeometry() as LineString).getCoordinates()),
                        image: new Circle({
                            radius: 5,
                            fill: new Fill({
                                color: '#aa0000dd'
                            })
                        })
                    })
                ]
            }
        });

        const draw = new Draw({
            source: vectorSource,
            type: "LineString",
        });

        const translate = new Translate({
            layers: [vectorLayer]
        });

        const mapObject: Map = new Map({
            interactions: defaultInteractions().extend([translate, draw]),
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

        // Translation events
        evtKeys.push(translate.on('translating', (evt) => {
            debouncedSetCoords(evt.features.getArray()[0]);
        }));
        evtKeys.push(translate.on('translatestart', () => {
            setTranslating(true);
        }));
        evtKeys.push(translate.on('translateend', () => {
            setTranslating(false);
        }));

        // Draw events
        evtKeys.push(draw.on('drawend', (evt) => {
            debouncedSetCoords(evt.feature);
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

    return (
        <div ref={ref} style={{width: '500px', height: '680px'}}/>
    )
}