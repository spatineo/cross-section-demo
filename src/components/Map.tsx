import { Feature, Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import WKT from 'ol/format/WKT';
import { useEffect, useMemo, useRef, useState } from "react";
import Select from 'ol/interaction/Select';
import Translate from 'ol/interaction/Translate';
import {defaults as defaultInteractions} from 'ol/interaction/defaults';

import 'ol/ol.css'
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { unByKey } from "ol/Observable";
import { debounce } from "lodash";

interface MapComponentProps {
    coordsWKT: null|string,
    setCoordsWKT: (wkt: string) => void;
}

export const MapComponent = ({coordsWKT, setCoordsWKT} : MapComponentProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<Map|null>(null);
    const [translate, setTranslate] = useState<Translate|null>(null);
 
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

        const select = new Select();

        const translate = new Translate({
            features: select.getFeatures(),
        });

        const mapObject: Map = new Map({
            interactions: defaultInteractions().extend([select, translate]),
            view: new View({
                projection: 'EPSG:3857',
                center: [2191602, 9461681],
                zoom: 4
            }),
            layers: [new TileLayer({
                source: new OSM()
            })]
        });

        mapObject.setTarget(ref.current);
        setMap(mapObject);
        setTranslate(translate);

        return () => {
            setTranslate(null);
            setMap(null);
            mapObject.setTarget(undefined);
            mapObject.dispose();
        }
    }, [ref]);

    useEffect(() => {
        if (!map || !coordsWKT || !translate) return;


        const format = new WKT();

        const feature = format.readFeature(coordsWKT, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });

        const vector = new VectorLayer({
            source: new VectorSource({
                features: [feature],
            })
        });

        map.addLayer(vector);

        const evtKey = translate.on('translating', (evt) => {
            debouncedSetCoords(evt.features.getArray()[0]);
        });

        return () => {
            map.removeLayer(vector);
            unByKey(evtKey);
        }

    }, [coordsWKT, translate, map, debouncedSetCoords]);

    return <div ref={ref} style={{width: '500px', height: '100%'}}/>;
}