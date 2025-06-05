import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  ImageOverlay,
  Rectangle,
  Tooltip,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

const IMAGE_WIDTH = 1000;
const IMAGE_HEIGHT = 800;
const MARKER_SIZE = 20;

const boundsFromPixel = (x, y, size = MARKER_SIZE) => [
  [y, x],
  [y + size, x + size],
];

const ClickHandler = ({ onClick }) => {
  useMap().on("click", (e) => {
    const { lat, lng } = e.latlng;
    onClick([lng, lat]);
  });
  return null;
};

const DrawControls = ({ onCreated }) => {
  const map = useMap();

  return (
    <EditControl
      position="topright"
      onCreated={onCreated}
      draw={{
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
        polyline: false,
        polygon: true, // Only allow polygon (wall drawing)
      }}
    />
  );
};

const IndoorMap = () => {
  const [products, setProducts] = useState([]);
  const [walls, setWalls] = useState([]); // Store wall polygons

  const handleMapClick = (pos) => {
    const name = prompt("Enter product name:");
    if (name) {
      setProducts((prev) => [...prev, { name, position: pos }]);
    }
  };

  const handleShapeCreated = (e) => {
    const layer = e.layer;
    const latlngs = layer.getLatLngs()[0]; // Get polygon points
    setWalls((prev) => [...prev, latlngs]);
  };

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={[
        [0, 0],
        [IMAGE_HEIGHT, IMAGE_WIDTH],
      ]}
      style={{ height: "90vh", width: "100%" }}
    >
      <ImageOverlay
        url="https://miro.medium.com/v2/resize:fit:1100/format:webp/0*5dlOrU5nGQsCuZVo.png"
        bounds={[
          [0, 0],
          [IMAGE_HEIGHT, IMAGE_WIDTH],
        ]}
      />

      <ClickHandler onClick={handleMapClick} />
      <DrawControls onCreated={handleShapeCreated} />

      {products.map((product, idx) => (
        <Rectangle
          key={idx}
          bounds={boundsFromPixel(product.position[0], product.position[1])}
          pathOptions={{ color: "#f97316", fillOpacity: 0.8 }}
        >
          <Tooltip sticky>{product.name}</Tooltip>
        </Rectangle>
      ))}

      {walls.map((wall, idx) => (
        <Polygon key={idx} positions={wall} pathOptions={{ color: "black", fillOpacity: 0.5 }} />
      ))}
    </MapContainer>
  );
};

export default IndoorMap;
