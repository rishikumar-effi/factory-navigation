import { useState, useEffect } from "react";
import { Rectangle, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useSteps } from "../../hooks/useSteps";
import { OBSTACLE_COLOR, LeafletCanvas } from "../LeafletCanvas";
import { CustomDrawControl } from "../../CustomDrawControl";

type Wall = {
  id: string;
  type: "rectangle";
  latlngs: [number, number][];
  productId: string;
};

const PRODUCT_COLOR = "#1976d2";

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
            <Marker
              position={[
                (wall.latlngs[0][0] + wall.latlngs[1][0]) / 2,
                (wall.latlngs[0][1] + wall.latlngs[1][1]) / 2,
              ]}
              icon={L.divIcon({
                className: "product-marker",
                html: `<div style="transform: translateY(-10px)">${product.productName}</div>`,
                iconSize: [60, 20],
              })}
            >
              <Tooltip>{product.productName}</Tooltip>
            </Marker>
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

  // Prepopulate from context on mount
  const [rectangles, setRectangles] = useState<Wall[]>(() => productWalls || []);
  const [selectedProductId, setSelectedProductId] = useState("");
  const markedProductIds = new Set(rectangles.map(r => String(r.productId)));  // Sync rectangles to context
  useEffect(() => {
    updateStepData("step3", { productWalls: rectangles });
  }, [rectangles, updateStepData]);

  // Set continue handler and validity
  useEffect(() => {
    const handleContinue = () => {
      updateStepData("step3", { productWalls: rectangles });
      setStepValidity("step3", true);
    };
    setContinueHandler(handleContinue);
    return () => setContinueHandler(() => { });
  }, [rectangles, updateStepData, setStepValidity, setContinueHandler]);

  // Drawing handler
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
    if (layer && wallWithId.id) {
      layer.options.wallId = wallWithId.id;
    }
    setSelectedProductId(""); // <-- Clear selection after marking
  };

  // Deletion handler
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

  // Edit handler (optional, similar to StepTwo)
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
        <option value="">Select Item</option>
        {productArray.map(({ productId, productName }: any) => (
          <option
            key={productId}
            value={productId}
            disabled={markedProductIds.has(String(productId))}
          >
            {productName}
          </option>
        ))}
      </select>
      <LeafletCanvas navigationData={navigationData}>
        <WallLayer walls={walls} color={OBSTACLE_COLOR} />
        <ProductWallLayer walls={rectangles} productArray={productArray} />
        {selectedProductId && (
          <CustomDrawControl
            onShapeDrawn={handleShapeDrawn}
            onShapeDeleted={handleShapesDeleted}
            onShapeEdited={handleShapesEdited}
            mode="product"
          />
        )}
      </LeafletCanvas>
    </>
  );
};