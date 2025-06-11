import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  ImageOverlay,
  Rectangle,
  Tooltip,
  useMap,
  Polygon,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

const IMAGE_WIDTH = 1000;
const IMAGE_HEIGHT = 800;
const MARKER_SIZE = 20;

const boundsFromPixel = (x: number, y: number, size = MARKER_SIZE): [[number, number], [number, number]] => [
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
  type Product = { name: string; position: [number, number] };
  const [products, setProducts] = useState<Product[]>([]);
  const [walls, setWalls] = useState<L.LatLng[][]>([]); // Store wall polygons

  const handleMapClick = (pos) => {
    const name = prompt("Enter product name:");
    if (name) {
      setProducts((prev: any) => [...prev, { name, position: pos }]);
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

const PathMapper = ({ setDynamicGrid }) => {
  type Product = { name: string; position: [number, number] };
  const [products, setProducts] = useState<Product[]>([]);
  const [walls, setWalls] = useState<L.LatLng[][]>([]); // Store wall polygons
  const [grid, setGrid] = useState<number[][] | null>(null);
  const navigate = (window as any).navigate || (() => {}); // fallback if not using react-router

  const handleMapClick = (pos) => {
    const name = prompt("Enter product name:");
    if (name) {
      setProducts((prev: any) => [...prev, { name, position: pos }]);
    }
  };

  const handleShapeCreated = (e) => {
    const layer = e.layer;
    const latlngs = layer.getLatLngs()[0]; // Get polygon points
    setWalls((prev) => [...prev, latlngs]);
  };

  // Point-in-polygon helper
  function pointInPolygon(x: number, y: number, polygon: L.LatLng[]) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi + 0.00001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Build grid from polygons
  const buildGridFromPolygons = () => {
    const rows = Math.ceil(IMAGE_HEIGHT / MARKER_SIZE);
    const cols = Math.ceil(IMAGE_WIDTH / MARKER_SIZE);
    const newGrid: number[][] = [];
    for (let y = 0; y < rows; y++) {
      const row: number[] = [];
      for (let x = 0; x < cols; x++) {
        // Center of cell
        const cellLat = y * MARKER_SIZE + MARKER_SIZE / 2;
        const cellLng = x * MARKER_SIZE + MARKER_SIZE / 2;
        // If inside any wall polygon, mark as obstacle
        const isObstacle = walls.some(polygon => pointInPolygon(cellLat, cellLng, polygon));
        row.push(isObstacle ? 1 : 0);
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    if (setDynamicGrid) setDynamicGrid(newGrid);
    if (navigate) navigate('/pathfinder');
  };

  return (
    <>
      <MapContainer
        crs={L.CRS.Simple}
        bounds={[[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]]}
        style={{ height: "90vh", width: "100%" }}
      >
        <ImageOverlay
          url="https://miro.medium.com/v2/resize:fit:1100/format:webp/0*5dlOrU5nGQsCuZVo.png"
          bounds={[[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]]}
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
      <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={buildGridFromPolygons}>Next</button>
      </div>
      {grid && (
        <pre style={{ maxHeight: 200, overflow: 'auto', background: '#eee', padding: 8 }}>
          {JSON.stringify(grid, null, 2)}
        </pre>
      )}
    </>
  );
};

export default PathMapper;
