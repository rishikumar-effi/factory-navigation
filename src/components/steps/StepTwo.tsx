import { useState } from "react";
import { Polygon, Rectangle, } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useSteps } from "../../hooks/useSteps";
import { LeafletCanvas } from "../LeafletCanvas";
import { CELL_SIZE, OBSTACLE_COLOR, IMAGE_WIDTH, IMAGE_HEIGHT } from "../LeafletCanvas";
import { CustomDrawControl } from "../../CustomDrawControl";

const GRID_ROWS = Math.ceil(IMAGE_HEIGHT / CELL_SIZE);
const GRID_COLS = Math.ceil(IMAGE_WIDTH / CELL_SIZE);

const IndoorMap = ({ walls, defineWalls }) => {
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

        defineWalls({ latlngs: bounds, type })
      }
    } else {
      defineWalls({ latlngs, type })
    }
  };

  return (
    <>
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
    </>
  );
};

const ObstacleLayer = ({ grid }: { grid: number[][] }) => (
  <>
    {grid.map((row, x) =>
      row.map((cell, y) =>
        cell !== 0 ? (
          <Rectangle
            key={`${x}-${y}`}
            bounds={[
              [x * CELL_SIZE, y * CELL_SIZE],
              [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE],
            ]}
            pathOptions={{ color: OBSTACLE_COLOR, weight: 1, fillOpacity: 0.8 }}
          />
        ) : null
      )
    )}
  </>
);

export const StepTwo = () => {
  const { navigationData, updateStepData } = useSteps();
  const { step2 } = navigationData;
  const { data } = step2;
  const { obstaclesArray } = data;

  const [walls, setWalls] = useState<any>([]);

  const [grid, setGrid] = useState<number[][]>(() => {
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

  const isCellInAnyRectangle = (x: number, y: number, wallsArg = walls) => {
    const cellMinLat = y * CELL_SIZE;
    const cellMaxLat = (y + 1) * CELL_SIZE;
    const cellMinLng = x * CELL_SIZE;
    const cellMaxLng = (x + 1) * CELL_SIZE;

    for (const wall of wallsArg) {
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

          // Check if cell and rectangle overlap at all
          if (
            cellMaxLat > minLat &&
            cellMinLat < maxLat &&
            cellMaxLng > minLng &&
            cellMinLng < maxLng
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const buildGridFromRectangles = () => {
    const newGrid: number[][] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      const row: number[] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        const isObstacle = isCellInAnyRectangle(x, y, walls);
        row.push(isObstacle ? 1 : 0);
      }
      newGrid.push(row);
    }
    
    setGrid(newGrid);
    updateStepData('step2', { obstaclesArray: newGrid });
  };

  const defineWalls = (props) => setWalls((prev) => [...prev, props]);

  return (<>
    <LeafletCanvas obstaclesArray={obstaclesArray} navigationData={navigationData}>
      <ObstacleLayer grid={obstaclesArray} />
      <IndoorMap walls={walls} defineWalls={defineWalls} />
    </LeafletCanvas>
    <button onClick={buildGridFromRectangles}>Generate Grid</button>
  </>
  );
};
