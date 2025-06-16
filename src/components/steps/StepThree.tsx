import { useState, useEffect } from "react";
import { Rectangle, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useSteps } from "../../hooks/useSteps";
import { OBSTACLE_COLOR, LeafletCanvas, CELL_SIZE } from "../LeafletCanvas";
import { CustomDrawControl } from "../../CustomDrawControl";
import { CoordinateToGridConverter, type WallCoordinate, type Product } from "../../utils/coOrdinateToGrid";

// Update your existing types to match the converter interface
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

// Helper function to convert your Wall type to WallCoordinate type
function convertWallsToWallCoordinates(walls: Wall[]): WallCoordinate[] {
  return walls.map(wall => ({
    id: wall.id,
    type: wall.type,
    latlngs: wall.latlngs,
  }));
}

// Helper function to convert your ProductRect type to Product type
function convertProductRectsToProducts(rectangles: ProductRect[]): Product[] {
  return rectangles.map(rect => ({
    id: rect.id,
    type: rect.type,
    latlngs: rect.latlngs,
    productId: rect.productId,
  }));
}

function getBounds(latlngs: any): [number, number, number, number] {
  if (!latlngs || latlngs.length === 0) {
    return [0, 0, 0, 0];
  }
  let lats: number[] = [];
  let lngs: number[] = [];
  if (
    Array.isArray(latlngs[0]) &&
    latlngs[0].length > 0 &&
    typeof latlngs[0][0] === "object" &&
    "lat" in latlngs[0][0] &&
    "lng" in latlngs[0][0]
  ) {
    const flat = latlngs[0];
    lats = flat.map((p: any) => p.lat);
    lngs = flat.map((p: any) => p.lng);
  } else if (
    Array.isArray(latlngs[0]) &&
    typeof latlngs[0][0] === "number" &&
    typeof latlngs[0][1] === "number"
  ) {
    lats = [latlngs[0][0], latlngs[1][0]];
    lngs = [latlngs[0][1], latlngs[1][1]];
  } else if (
    typeof latlngs[0] === "object" &&
    "lat" in latlngs[0] &&
    "lng" in latlngs[0]
  ) {
    lats = latlngs.map((p: any) => p.lat);
    lngs = latlngs.map((p: any) => p.lng);
  }
  if (lats.length === 0 || lngs.length === 0) return [0, 0, 0, 0];
  return [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];
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

  const handleGenerateGrid = () => {
    try {
      // 1. Convert your data types to the converter's expected format
      const wallCoordinates: WallCoordinate[] = convertWallsToWallCoordinates(walls);
      const products: Product[] = convertProductRectsToProducts(rectangles);

      // 2. Use the TypeScript grid converter
      const gridResult = CoordinateToGridConverter.convertToGrid(
        wallCoordinates, 
        products, 
        CELL_SIZE // Use your existing CELL_SIZE constant
      );

      console.log('Generated grid:', gridResult);
      console.log('Grid dimensions:', gridResult.info.width, 'x', gridResult.info.height);
      console.log('Grid bounds:', gridResult.info.bounds);

      // 3. Update productArray with rectangle coordinates (keep your existing logic)
      const updatedProductArray = productArray.map(product => {
        const rect = rectangles.find(r => String(r.productId) === String(product.productId));
        if (rect && rect.latlngs && rect.latlngs[0]) {
          return {
            ...product,
            coOrds: rect.latlngs[0],
          };
        }
        return product;
      });

      // 4. Update step data with the new grid and converter instance
      updateStepData('step4', { 
        finalArray: gridResult.grid,
        gridInfo: gridResult.info,
        converter: gridResult.converter // Save converter for coordinate transformations
      });
      updateStepData('step3', { productArray: updatedProductArray });
      setStepValidity('step4', true);

      console.log('Grid generation completed successfully');
    } catch (error) {
      console.error('Error generating grid:', error);
    }
  };

  useEffect(() => {
    updateStepData("step3", { productWalls: rectangles });
  }, [rectangles, updateStepData]);

  useEffect(() => {
    const handleGenerateGridWrapper = () => {
      handleGenerateGrid();
    };

    setContinueHandler(handleGenerateGridWrapper);
    return () => setContinueHandler(() => { });
  }, [rectangles, walls, productArray, updateStepData, setStepValidity, setContinueHandler]);

  useEffect(() => {
    updateStepData('step4', []);
    setStepValidity('step3', false);
  }, []);

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
      {/* <Button onClick={handleGenerateGrid}>Generate Grid</Button> */}
    </>
  );
};