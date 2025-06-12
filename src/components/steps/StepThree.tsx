import { useState, useEffect } from "react";
import { Rectangle, Polygon, Polyline, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useSteps } from "../../hooks/useSteps";
import { OBSTACLE_COLOR, LeafletCanvas } from "../LeafletCanvas";
import { CustomDrawControl } from "../../CustomDrawControl";

type Wall = {
  id: string;
  type: "rectangle" | "polygon" | "polyline";
  latlngs: [number, number][];
  productId?: string;
};

const WallLayer = ({ walls, color }) => (
  <>
    {walls.map((wall) =>
      wall.type === "rectangle" ? (
        <Rectangle
          key={wall.id}
          bounds={wall.latlngs}
          pathOptions={{ color, weight: 2, fillOpacity: 0.5 }}
        />
      ) : wall.type === "polygon" ? (
        <Polygon
          key={wall.id}
          positions={wall.latlngs}
          pathOptions={{ color, weight: 2, fillOpacity: 0.5 }}
        />
      ) : wall.type === "polyline" ? (
        <Polyline
          key={wall.id}
          positions={wall.latlngs}
          pathOptions={{ color, weight: 4 }}
        />
      ) : null
    )}
  </>
);

const ProductWallMarkers = ({ walls, productArray }) => (
  <>
    {walls.map((wall) => {
      const product = productArray.find((p) => p.productId === wall.productId);
      if (!product) return null;
      let center: any;
      if (wall.type === "rectangle" && wall.latlngs.length === 2) {
        center = [
          (wall.latlngs[0][0] + wall.latlngs[1][0]) / 2,
          (wall.latlngs[0][1] + wall.latlngs[1][1]) / 2,
        ];
      } else if (wall.latlngs.length > 0) {
        center = Array.isArray(wall.latlngs[0])
          ? wall.latlngs[0]
          : [wall.latlngs[0].lat, wall.latlngs[0].lng];
      } else {
        return null;
      }
      return (
        <Marker
          key={wall.id}
          position={center}
          icon={L.divIcon({
            className: "product-marker",
            html: `<div style="transform: translateY(-10px)">${product.productName}</div>`,
            iconSize: [60, 20],
          })}
        >
          <Tooltip>{product.productName}</Tooltip>
        </Marker>
      );
    })}
  </>
);

export const StepThree = () => {
  const { navigationData } = useSteps();
  const { walls } = navigationData.step2.data;
  const { productArray } = navigationData.step3.data;

  const [step3Walls, setStep3Walls] = useState<Wall[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const handleShapeDrawn = (latlngs, type, layer) => {
    if (!selectedProductId) {
      alert("Please select a product before drawing.");
      return;
    }
    const wallWithId: Wall = {
      id: crypto.randomUUID(),
      type,
      latlngs,
      productId: selectedProductId,
    };
    setStep3Walls((prev) => [...prev, wallWithId]);
    if (layer && wallWithId.id) {
      layer.options.wallId = wallWithId.id;
    }
  };

  useEffect(() => {
    console.log(step3Walls);
  }, [step3Walls])

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
        {productArray.map(({ productId, productName }) => (
          <option key={productId} value={productId}>
            {productName}
          </option>
        ))}
      </select>
      <LeafletCanvas navigationData={navigationData}>
        <WallLayer walls={walls} color={OBSTACLE_COLOR} />
        <WallLayer walls={step3Walls} color="#1976d2" />
        <ProductWallMarkers walls={step3Walls} productArray={productArray} />
        <CustomDrawControl
          onShapeDrawn={handleShapeDrawn}
        />
      </LeafletCanvas>
    </>
  );
};