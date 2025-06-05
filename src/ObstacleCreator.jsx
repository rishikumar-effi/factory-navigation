import React, { useEffect, useRef } from "react";
import { MapContainer, ImageOverlay, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

const imageUrl = "https://miro.medium.com/v2/resize:fit:1100/format:webp/0*5dlOrU5nGQsCuZVo.png"; // replace with your image URL
const imageBounds = [
  [0, 0],   // top-left corner coords (y, x)
  [500, 500] // bottom-right corner coords (y, x)
];

function LeafletDrawControl({ onDrawCreated }) {
  const map = useMap();
  const drawnItemsRef = useRef();

  useEffect(() => {
    if (!map) return;

    // FeatureGroup to store drawn layers
    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    // Draw control options
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
      },
      draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true,
        circlemarker: false,
      },
    });
    map.addControl(drawControl);

    // When a shape is created
    const onCreated = (e) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      if (onDrawCreated) onDrawCreated(layer);
    };

    map.on(L.Draw.Event.CREATED, onCreated);

    // Cleanup
    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onDrawCreated]);

  return null;
}

export default function ImageDrawExample() {
  const handleDrawCreated = (layer) => {
    console.log("Shape drawn:", layer);
    console.log("GeoJSON:", layer.toGeoJSON());
  };

  return (
    <MapContainer
      crs={L.CRS.Simple} // Important: use simple CRS to treat coords as pixels
      bounds={imageBounds}
      style={{ minHeight: '80vh', width: "100%", margin: "0 auto" }}
    >
      {/* Show image as overlay */}
      <ImageOverlay url={imageUrl} bounds={imageBounds} />

      {/* Draw control */}
      <LeafletDrawControl onDrawCreated={handleDrawCreated} />
    </MapContainer>
  );
}
