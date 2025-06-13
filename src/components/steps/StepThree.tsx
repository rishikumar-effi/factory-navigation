import { useState, useEffect } from "react";
import { Rectangle, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useSteps } from "../../hooks/useSteps";
import { OBSTACLE_COLOR, LeafletCanvas } from "../LeafletCanvas";
import { CustomDrawControl } from "../../CustomDrawControl";
import { Button } from "@mui/material";

type Wall = {
  id: string;
  type: "rectangle";
  latlngs: [number, number][];
  productId: string;
};

const PRODUCT_COLOR = "#1976d2";

type ProductRect = {
  id: string;
  type: "rectangle";
  latlngs: { lat: number; lng: number }[][];
  productId: string;
};

function getBounds(latlngs: any): [number, number, number, number] {
  if (!latlngs || latlngs.length === 0) {
    return [0, 0, 0, 0];
  }
  let lats: number[] = [];
  let lngs: number[] = [];
  if (Array.isArray(latlngs[0])) {
    // Wall: [[lat, lng], [lat, lng]]
    if (latlngs.length < 2) return [0, 0, 0, 0];
    lats = [latlngs[0][0], latlngs[1][0]];
    lngs = [latlngs[0][1], latlngs[1][1]];
  } else if (typeof latlngs[0] === "object") {
    // Product: [[{lat, lng}, ...]]
    const flat = latlngs.flat();
    if (flat.length === 0) return [0, 0, 0, 0];
    lats = flat.map((p: any) => p.lat);
    lngs = flat.map((p: any) => p.lng);
  }
  return [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];
}

function generate2DGrid(
  walls: Wall[],
  rectangles: ProductRect[],
  rows = 60,
  cols = 60,
  cellSize = 10
) {
  const grid: (number | string)[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0)
  );

  // Mark walls as 1
  walls.forEach((wall) => {
    const [minLat, maxLat, minLng, maxLng] = getBounds(wall.latlngs);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const y = r * cellSize;
        const x = c * cellSize;
        if (
          y >= minLat &&
          y <= maxLat &&
          x >= minLng &&
          x <= maxLng
        ) {
          grid[r][c] = 1;
        }
      }
    }
  });

  // Mark product rectangles with productId
  rectangles.forEach((rect) => {
    const [minLat, maxLat, minLng, maxLng] = getBounds(rect.latlngs);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const y = r * cellSize;
        const x = c * cellSize;
        if (
          y >= minLat &&
          y <= maxLat &&
          x >= minLng &&
          x <= maxLng
        ) {
          grid[r][c] = rect.productId;
        }
      }
    }
  });

  return grid;
}

const ProductWallLayer = ({
  walls = [],
  productArray = [],
}: {
  walls?: Wall[];
  productArray?: any[];
}) => (
  <>
    {walls.map((wall) => {
      const product = productArray.find((p) => p.productId === wall.productId);
      return (
        <Rectangle
          key={wall.id}
          bounds={wall.latlngs}
          pathOptions={{ color: PRODUCT_COLOR, weight: 2, fillOpacity: 0.5 }}
        >
          {product && (
            <Tooltip direction="top" offset={[0, -10]}>
              {product.productName}
            </Tooltip>
          )}
        </Rectangle>
      );
    })}
  </>
);

const WallLayer = ({ walls = [], color }: { walls?: any[]; color: string }) => (
  <>
    {walls.map((wall) =>
      wall.type === "rectangle" ? (
        <Rectangle
          key={wall.id}
          bounds={wall.latlngs}
          pathOptions={{ color, weight: 2, fillOpacity: 0.5 }}
        />
      ) : null
    )}
  </>
);

export const StepThree = () => {
  const { navigationData, updateStepData, setContinueHandler, setStepValidity } = useSteps();
  const { walls = [] } = navigationData.step2.data || {};
  const { productWalls = [], productArray = [] } = navigationData.step3.data || {};

  const [rectangles, setRectangles] = useState<any>(() => productWalls || []);
  const [selectedProductId, setSelectedProductId] = useState("");

  const [grid, setGrid] = useState<(number | string)[][]>([]);

  const handleGenerateGrid = () => {
    const newGrid = generate2DGrid(walls, rectangles);
    setGrid(newGrid);
    console.log(newGrid); // For debugging
  };

  useEffect(() => {
    updateStepData("step3", { productWalls: rectangles });
  }, [rectangles, updateStepData]);

  useEffect(() => {
    const handleContinue = () => {
      updateStepData("step3", { productWalls: rectangles });
      setStepValidity("step3", true);
    };
    setContinueHandler(handleContinue);
    return () => setContinueHandler(() => { });
  }, [rectangles, updateStepData, setStepValidity, setContinueHandler]);

  const handleShapeDrawn = (latlngs: any, type: string, layer?: any) => {
    if (type !== "rectangle") return;
    if (!selectedProductId) {
      alert("Please select a product before drawing.");
      return;
    }
    const wallWithId: Wall = {
      id: crypto.randomUUID(),
      type: "rectangle",
      latlngs,
      productId: selectedProductId,
    };
    setRectangles((prev) => [...prev, wallWithId]);
    setSelectedProductId("");
    if (layer && wallWithId.id) {
      layer.options.wallId = wallWithId.id;
    }
    setSelectedProductId(""); // <-- Clear selection after marking
  };

  const getBoundsFromLatLngs = (latlngs: any) => {
    if (latlngs.length === 2 && Array.isArray(latlngs[0]) && Array.isArray(latlngs[1])) {
      return latlngs;
    }
    const flat = latlngs.flat();
    const lats = flat.map((p: any) => Array.isArray(p) ? p[0] : p.lat);
    const lngs = flat.map((p: any) => Array.isArray(p) ? p[1] : p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  };

  const areBoundsEqual = (a: any, b: any) => {
    return (
      Math.abs(a[0][0] - b[0][0]) < 1e-8 &&
      Math.abs(a[0][1] - b[0][1]) < 1e-8 &&
      Math.abs(a[1][0] - b[1][0]) < 1e-8 &&
      Math.abs(a[1][1] - b[1][1]) < 1e-8
    );
  };

  const handleShapesDeleted = (deletedLatLngs: any[]) => {
    const filtered = rectangles.filter((wall) => {
      const wallBounds = getBoundsFromLatLngs(wall.latlngs);
      return !deletedLatLngs.some((deleted) => {
        const deletedBounds = getBoundsFromLatLngs(deleted);
        return areBoundsEqual(wallBounds, deletedBounds);
      });
    });
    setRectangles(filtered);
    updateStepData("step3", { productWalls: filtered });
  };

  const handleShapesEdited = (editedShapes: any[]) => {
    let updated = [...rectangles];
    editedShapes.forEach(({ latlngs, wallId }) => {
      const idx = updated.findIndex((wall) => wall.id === wallId);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], latlngs };
      }
    });
    setRectangles(updated);
    updateStepData("step3", { productWalls: updated });
  };

  return (
    <>
      <select
        value={selectedProductId}
        onChange={(e) => setSelectedProductId(e.target.value)}
        style={{
          minHeight: "30px",
          padding: "6px 12px",
          alignSelf: "center",
          marginBottom: "1em",
        }}
      >
        <option value="--">Select Item</option>
        {productArray.map(({ productId, productName }: any) => {
          const isMarkedAlready = rectangles.some((rect) => +rect.productId === productId);

          return (<option key={productId} disabled={isMarkedAlready} value={productId}>
            {productName}
          </option>)
        })}
      </select>
      <LeafletCanvas navigationData={navigationData}>
        <WallLayer walls={walls} color={OBSTACLE_COLOR} />
        <ProductWallLayer walls={rectangles} productArray={productArray} />
        <CustomDrawControl
          onShapeDrawn={handleShapeDrawn}
          onShapeDeleted={handleShapesDeleted}
          onShapeEdited={handleShapesEdited}
          disableDraw={!selectedProductId}
        />
      </LeafletCanvas>
      <Button onClick={handleGenerateGrid}>Generate Grid</Button>
    </>
  );
};