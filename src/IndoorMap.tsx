import React, { useState } from "react";
import { MapContainer, ImageOverlay, Polygon, Rectangle, } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import CustomDrawControl from "./CustomDrawControl";
import { useNavigate } from 'react-router-dom';

const IMAGE_WIDTH = 1000;
const IMAGE_HEIGHT = 800;
const CELL_SIZE = 20; // Use the same cell size as StorePathFinder
const GRID_ROWS = Math.ceil(IMAGE_HEIGHT / CELL_SIZE);
const GRID_COLS = Math.ceil(IMAGE_WIDTH / CELL_SIZE);

const IndoorMap = ({ setDynamicGrid }: { setDynamicGrid: any }) => {
  const [walls, setWalls] = useState<any>([]);
  const [grid, setGrid] = useState<number[][]>(() => {
    // Default: empty grid (all walkable)
    const arr: number[][] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      const row: number[] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        row.push(0);
      }
      arr.push(row);
    }
    return arr;
  });

  const navigate = useNavigate();

  function normalizeLatLngArray(input: any): [number, number][] {
    return input.map((point: any) =>
      Array.isArray(point) ? point : [point.lat, point.lng]
    );
  }


  const handleShapeCreated = (latlngs: any, type: any) => {
    if (type === "rectangle") {
      let bounds: [[number, number], [number, number]];

      if (Array.isArray(latlngs)) {
        if (
          latlngs.length === 2 &&
          (Array.isArray(latlngs[0]) || latlngs[0].lat !== undefined)
        ) {
          // Convert to [number, number]
          const normalized = normalizeLatLngArray(latlngs);
          if (normalized.length === 2) {
            bounds = normalized as [[number, number], [number, number]];
          } else {
            console.warn("Normalized rectangle length mismatch:", normalized);
            return;
          }
        } else if (
          latlngs.length === 1 &&
          Array.isArray(latlngs[0]) &&
          latlngs[0].length >= 4
        ) {
          // Polygon-style rectangle, convert bounding box
          const flat = normalizeLatLngArray(latlngs[0]);
          const lats = flat.map((p) => p[0]);
          const lngs = flat.map((p) => p[1]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          bounds = [
            [minLat, minLng],
            [maxLat, maxLng],
          ];
        } else {
          console.warn("Unknown rectangle format:", latlngs);
          return;
        }

        setWalls((prev) => [...prev, { latlngs: bounds, type }]);
      }
    } else {
      setWalls((prev) => [...prev, { latlngs, type }]);
    }
  };


  // Helper: Check if a cell is inside any rectangle
  const isCellInAnyRectangle = (x: number, y: number) => {
    // Rectangle bounds are in [lat, lng] (y, x) pixel space
    const cellLat = y * CELL_SIZE + CELL_SIZE / 2;
    const cellLng = x * CELL_SIZE + CELL_SIZE / 2;
    for (const wall of walls) {
      if (wall.type === "rectangle") {
        const latlngs = wall.latlngs;
        if (
          Array.isArray(latlngs) &&
          latlngs.length === 2 &&
          Array.isArray(latlngs[0]) && latlngs[0].length === 2 &&
          Array.isArray(latlngs[1]) && latlngs[1].length === 2
        ) {
          const [[lat1, lng1], [lat2, lng2]] = latlngs;
          const minLat = Math.min(lat1, lat2);
          const maxLat = Math.max(lat1, lat2);
          const minLng = Math.min(lng1, lng2);
          const maxLng = Math.max(lng1, lng2);
          // Debug output for rectangle bounds and cell
          if (
            cellLat >= minLat &&
            cellLat <= maxLat &&
            cellLng >= minLng &&
            cellLng <= maxLng
          ) {
            // Debug: log which cell is inside which rectangle
            console.log(`Cell (${x},${y}) center=(${cellLat},${cellLng}) is inside rectangle [(${lat1},${lng1}),(${lat2},${lng2})]`);
            return true;
          }
        }
      }
    }
    // Debug: log which cell is not inside any rectangle
    // console.log(`Cell (${x},${y}) center=(${cellLat},${cellLng}) is NOT in any rectangle`);
    return false;
  };

  // Build grid from rectangles
  const buildGridFromRectangles = () => {
    const newGrid: number[][] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      const row: number[] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const isObstacle = isCellInAnyRectangle(x, y);
        // Debug: log grid value for each cell
        if (isObstacle) {
          console.log(`Grid[${y}][${x}] = 1 (obstacle)`);
        }
        row.push(isObstacle ? 1 : 0);
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    if (setDynamicGrid) setDynamicGrid(newGrid);
    navigate('/pathfinder');
  };

  // Optionally: Add a button to copy the grid to clipboard
  const copyGridToClipboard = () => {
    if (grid) {
      navigator.clipboard.writeText(JSON.stringify(grid));
      alert("Grid copied to clipboard!");
    }
  };

  return (
    <>
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

        <CustomDrawControl onShapeDrawn={handleShapeCreated} />

        {walls.map((wall, idx) =>
          wall.type === "rectangle" ? (
            <Rectangle
              key={idx}
              bounds={wall.latlngs}
              pathOptions={{ color: "black", fillOpacity: 0.5 }}
            />
          ) : (
            <Polygon
              key={idx}
              positions={wall.latlngs}
              pathOptions={{ color: "black", fillOpacity: 0.5 }}
            />
          )
        )}
      </MapContainer>
      <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={buildGridFromRectangles}>Next</button>
        <button onClick={() => setWalls([])}>End</button>
        <button onClick={copyGridToClipboard} disabled={!grid}>Copy Grid</button>
      </div>
      {grid && (
        <pre style={{ maxHeight: 200, overflow: 'auto', background: '#eee', padding: 8 }}>
          {JSON.stringify(grid, null, 2)}
        </pre>
      )}
    </>
  );
};

export default IndoorMap;
