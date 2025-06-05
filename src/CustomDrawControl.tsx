import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from 'leaflet';
import { LeafletEvent } from 'leaflet';
import { DrawEvents } from "leaflet";

import "leaflet-draw";

const CustomDrawControl = ({ onShapeDrawn }) => {
    const map = useMap();

    useEffect(() => {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            draw: {
                polygon: false,
                rectangle: {
                    shapeOptions: { color: "#007bff" },
                },
                circle: false,
                marker: false,
                polyline: {
                    shapeOptions: { color: "#16a34a", weight: 4 },
                },
                circlemarker: false,
            },
            edit: {
                featureGroup: drawnItems,
            },
        });

        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, (e: LeafletEvent) => {
            const event = e as DrawEvents;
            const { layer, layerType } = event;
            drawnItems.addLayer(layer);
            const latlngs = layer.getLatLngs?.() ?? null;

            if (onShapeDrawn && latlngs) {
                onShapeDrawn(latlngs, layerType);
            }
        });

        return () => {
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
        };
    }, [map, onShapeDrawn]);

    return null;
};

export default CustomDrawControl;
