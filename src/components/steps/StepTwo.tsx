import { useState, useEffect } from "react";
import { Polygon, Rectangle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useSteps } from "../../hooks/useSteps";
import { LeafletCanvas } from "../LeafletCanvas";
import { CustomDrawControl } from "../../CustomDrawControl";

type Wall = {
  id: string;
  type: string;
  latlngs: [number, number][];
};

const IndoorMap = ({ walls, defineWalls, handleShapesDeleted, handleShapesEdited }) => {
  function normalizeLatLngArray(input: any): [number, number][] {
    return input.map((point: any) =>
      Array.isArray(point) ? point : [point.lat, point.lng]
    );
  }

  // When a shape is created, assign a unique id and set it on the Leaflet layer
  const handleShapeCreated = (latlngs: any, type: any, layer?: any) => {
    let bounds: [[number, number], [number, number]] | undefined;
    let wallWithId;
    if (type === "rectangle") {
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
        wallWithId = { latlngs: bounds, type, id: crypto.randomUUID() };
      }
    }
     else {
      wallWithId = { latlngs, type, id: crypto.randomUUID() };
    }
    if (wallWithId) {
      defineWalls(wallWithId);
      // Set wallId on the Leaflet layer so edits can be tracked
      if (layer && wallWithId.id) {
        layer.options.wallId = wallWithId.id;
      }
    }
  };

  return (
    <>
      <CustomDrawControl
        onShapeDrawn={handleShapeCreated}
        onShapeDeleted={handleShapesDeleted}
        onShapeEdited={handleShapesEdited}
      />

      {walls.map((wall, idx) =>
        wall.type === "rectangle" ? (
          <Rectangle
            key={wall.id}
            bounds={wall.latlngs}
            pathOptions={{ color: "black", fillOpacity: 0.5 }}
          />
        ) : (
          <Polygon
            key={wall.id}
            positions={wall.latlngs}
            pathOptions={{ color: "black", fillOpacity: 0.5 }}
          />
        )
      )}
    </>
  );
};

export const StepTwo = () => {
  const { navigationData, updateStepData, setContinueHandler, setStepValidity } = useSteps();
  const { step2 } = navigationData;
  const { data } = step2;
  const { walls: generatedWalls } = data;

  const [walls, setWalls] = useState<Wall[]>([]);

  // Restore walls from context only on first mount
  useEffect(() => {
    if (walls.length === 0 && generatedWalls && generatedWalls.length > 0) {
      setWalls(generatedWalls);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleContinue = () => {
      updateStepData('step2', { walls });
      setStepValidity('step2', true);
    };

    setContinueHandler(handleContinue);

    return () => {
      setContinueHandler(() => { });
    };
  }, [walls, updateStepData, setStepValidity, setContinueHandler]);

  // Add a new wall with unique id
  const defineWalls = (wallWithId) => {
    setWalls([...walls, wallWithId]);
    updateStepData('step2', { walls: [...walls, wallWithId] });
  };

  const getBoundsFromLatLngs = (latlngs) => {
    // Handles both polygon (array of 4+ points) and bounds (2 points)
    if (latlngs.length === 2 && Array.isArray(latlngs[0]) && Array.isArray(latlngs[1])) {
      // Already bounds
      return latlngs;
    }
    // Polygon: get min/max
    const flat = latlngs.flat();
    const lats = flat.map((p) => Array.isArray(p) ? p[0] : p.lat);
    const lngs = flat.map((p) => Array.isArray(p) ? p[1] : p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  };

  const areBoundsEqual = (a, b) => {
    return (
      Math.abs(a[0][0] - b[0][0]) < 1e-8 &&
      Math.abs(a[0][1] - b[0][1]) < 1e-8 &&
      Math.abs(a[1][0] - b[1][0]) < 1e-8 &&
      Math.abs(a[1][1] - b[1][1]) < 1e-8
    );
  };

  const handleShapesDeleted = (deletedLatLngs) => {
    const filteredWalls = walls.filter(wall => {
      if (wall.type === "rectangle") {
        const wallBounds = getBoundsFromLatLngs(wall.latlngs);
        return !deletedLatLngs.some(deleted => {
          const deletedBounds = getBoundsFromLatLngs(deleted);
          return areBoundsEqual(wallBounds, deletedBounds);
        });
      } else if (wall.type === "polygon") {
        return !deletedLatLngs.some(
          deleted => JSON.stringify(wall.latlngs) === JSON.stringify(deleted)
        );
      }
      return true;
    });
    setWalls(filteredWalls);
    updateStepData('step2', { walls: filteredWalls });
  };

  // Use wallId to update the correct wall after edit
  const handleShapesEdited = (editedShapes) => {
    let updatedWalls = [...walls];
    editedShapes.forEach(({ latlngs, layerType, wallId }) => {
      const idx = updatedWalls.findIndex(wall => wall.id === wallId);
      if (idx !== -1) {
        updatedWalls[idx] = { ...updatedWalls[idx], latlngs };
      }
    });
    setWalls(updatedWalls);
    updateStepData('step2', { walls: updatedWalls });
  };

  return (
    <LeafletCanvas navigationData={navigationData}>
      <IndoorMap
        walls={walls}
        defineWalls={defineWalls}
        handleShapesDeleted={handleShapesDeleted}
        handleShapesEdited={handleShapesEdited}
      />
    </LeafletCanvas>
  );
};