import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import { LeafletEvent } from "leaflet";
import "leaflet-draw";

// @ts-ignore: leaflet-draw augments L.Control at runtime
const drawnItems = new L.FeatureGroup();

export const CustomDrawControl = ({
    onShapeDrawn,
    onShapeDeleted,
    onShapeEdited,
    mode = "grid",
}) => {
    const map = useMap();

    useEffect(() => {
        map.addLayer(drawnItems);

        // Patch: Disable area tooltip for rectangles to avoid leaflet-draw bug
        if ((L as any).Draw && (L as any).Draw.Rectangle) {
            (L as any).Draw.Rectangle.prototype._getTooltipText = function () {
                return {
                    text: "Click and drag to draw rectangle.",
                };
            };
        }

        const rectColor = mode === "product" ? "#A2E458" : "#222";
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

        // Handle shape creation
        map.on(L.Draw.Event.CREATED, (e: LeafletEvent) => {
            const event = e as any;
            const { layer, layerType } = event;
            // Get wallId from your wall object if possible
            // You need to pass wallId from StepTwo/IndoorMap to here
            if (layer.options && event.wallId) {
                layer.options.wallId = event.wallId;
            }
            drawnItems.addLayer(layer);
            const latlngs = layer.getLatLngs?.() ?? null;

            if (onShapeDrawn && latlngs) {
                onShapeDrawn(latlngs, layerType, layer); // Pass layer if you want to set wallId
            }
        });

        // Handle shape deletion
        map.on(L.Draw.Event.DELETED, (e: LeafletEvent) => {
            const event = e as any;
            const deletedLatLngs: any[] = [];
            event.layers.eachLayer((layer: any) => {
                const latlngs = layer.getLatLngs?.() ?? null;
                if (latlngs) {
                    deletedLatLngs.push(latlngs);
                }
            });
            if (onShapeDeleted && deletedLatLngs.length > 0) {
                onShapeDeleted(deletedLatLngs);
            }
        });

        // Handle shape edit
        map.on(L.Draw.Event.EDITED, (e: any) => {
            const editedLatLngs: any[] = [];
            e.layers.eachLayer((layer: any) => {
                const latlngs = layer.getLatLngs?.() ?? null;
                const wallId = layer.options.wallId;
                if (latlngs && wallId) {
                    editedLatLngs.push({
                        latlngs,
                        layerType: layer instanceof L.Rectangle ? "rectangle" : "polygon",
                        wallId,
                    });
                }
            });
            if (onShapeEdited && editedLatLngs.length > 0) {
                onShapeEdited(editedLatLngs);
            }
        });
        return () => {
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
            map.off(L.Draw.Event.CREATED);
            map.off(L.Draw.Event.DELETED);
            map.off(L.Draw.Event.EDITED);
        };
    }, [map, onShapeDrawn, onShapeDeleted, onShapeEdited, mode]);

    return null;
};