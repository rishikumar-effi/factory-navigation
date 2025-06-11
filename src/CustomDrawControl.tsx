import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from 'leaflet';
import { LeafletEvent } from 'leaflet';

import "leaflet-draw";

// TypeScript declaration to allow L.Draw usage
// (Removed redundant declaration of L.Draw to avoid redeclaration error)

// @ts-ignore: leaflet-draw augments L.Control at runtime
const drawnItems = new L.FeatureGroup(); // Move outside component to persist

const CustomDrawControl = ({ onShapeDrawn, mode = "grid" }) => {
    const map = useMap();

    useEffect(() => {
        map.addLayer(drawnItems);

        // Patch: Disable area tooltip for rectangles to avoid leaflet-draw bug
        if ((L as any).Draw && (L as any).Draw.Rectangle) {
            (L as any).Draw.Rectangle.prototype._getTooltipText = function () {
                return {
                    text: 'Click and drag to draw rectangle.',
                };
            };
        }

        // Rectangle color based on mode
        const rectColor = mode === "product" ? "#A2E458" : "#222";
        // Only allow edit/delete in product mode
        const editOptions = { featureGroup: drawnItems };
        // @ts-ignore: Draw is added by leaflet-draw at runtime
        const drawControl = new (L.Control as any).Draw({
            draw: {
                polygon: false,
                rectangle: {
                    shapeOptions: { color: rectColor },
                },
                circle: false,
                marker: false,
                polyline: {
                    shapeOptions: { color: "#16a34a", weight: 4 },
                },
                circlemarker: false,
            },
            edit: editOptions,
        });

        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, (e: LeafletEvent) => {
            const event = e as any;
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
    }, [map, onShapeDrawn, mode]);

    return null;
};

export default CustomDrawControl;
