import React, { useState, useCallback, useEffect, useRef } from "react";
import L, { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import PathFinder from "./utils/pathFinder";
import { MapContainer, Rectangle, useMapEvents, Tooltip } from "react-leaflet";
import CustomDrawControl from "./CustomDrawControl";
import { Autocomplete, TextField } from "@mui/material";

const CELL_SIZE = 20; // pixels per grid cell

const GridLayer = ({ grid, startPos, paths, onCellClick }: { grid: any, startPos: any, paths: any, onCellClick: any }) => {

  return (
    <>
      {grid[0] && grid[0].length > 0 && grid.map((row: number[], y: number) =>
        row.map((cell: number, x: number) => {
          const isStart = startPos.x === x && startPos.y === y;
          const isPath = paths.some((p: { x: number; y: number }) => p.x === x && p.y === y);

          let color = "#fff";
          if (cell === 1) color = "#333"; // wall
          if (isPath) color = "#4ade80"; // path
          if (isStart) color = "#0ea5e9"; // start

          return (
            <React.Fragment key={`cell-${x}-${y}`}>
              <Rectangle
                bounds={boundsFromGrid(x, y)}
                pathOptions={{ color, weight: 1, fillOpacity: 0.6 }}
                eventHandlers={{
                  click: () => onCellClick(x, y),
                }}
              />
              {/* Show product ID in the center of the cell if cell > 1 (product) */}
              {cell > 1 && (
                <div
                  key={`label-${x}-${y}`}
                  style={{
                    position: 'absolute',
                    left: x * CELL_SIZE + CELL_SIZE / 2,
                    top: y * CELL_SIZE + CELL_SIZE / 2,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    color: '#0ea5e9',
                    fontWeight: 'bold',
                    fontSize: 12,
                    zIndex: 1000,
                  }}
                >
                  {cell}
                </div>
              )}
            </React.Fragment>
          );
        })
      )}
    </>
  );
};

const boundsFromGrid = (x: number, y: number): [[number, number], [number, number]] => [
  [y * CELL_SIZE, x * CELL_SIZE],
  [(y + 1) * CELL_SIZE, (x + 1) * CELL_SIZE],
];

const PRODUCT_OPTIONS = [
  { value: 1, label: "Beer" },
  { value: 2, label: "Frozen Goods" },
  { value: 3, label: "Ice" },
  { value: 4, label: "Household" },
  { value: 5, label: "ATM" },
  { value: 6, label: "Lotto" },
  { value: 7, label: "Seasonal" },
  { value: 8, label: "Medical/Health" },
  { value: 9, label: "Candy" },
  { value: 10, label: "Jerky & Nuts" },
  { value: 11, label: "Chips" },
  { value: 12, label: "Breakfast" },
  { value: 13, label: "Dry Goods" },
  { value: 14, label: "Specials" },
  { value: 15, label: "Roller Grill" },
  { value: 16, label: "POS" },
  { value: 17, label: "Hot Food" },
  { value: 18, label: "Magazines" },
  { value: 19, label: "Automotive" },
  { value: 20, label: "Tobacco Products" },
  { value: 21, label: "Condiments" },
  { value: 22, label: "Coffee Bar" },
  { value: 23, label: "Frozen Beverages" },
  { value: 24, label: "Soft Drinks" },
];

const PathfinderMap = ({ dynamicGrid }) => {
  const markerRefs = useRef({});
  const lastOpenMarkerRef = useRef<L.Marker | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Use dynamicGrid if provided, otherwise fallback to initialGrid
  const initialGrid = [];

  // Define the starting position (update as needed)
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const LOCAL_STORAGE_KEY = "factory-navigation-grid";

  // Load grid from localStorage if available, else use dynamicGrid or initialGrid
  const [grid, setGrid] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to dynamicGrid or initialGrid
      }
    }
    return dynamicGrid || initialGrid;
  });

  // Save grid to localStorage whenever a new map is generated (dynamicGrid changes)
  useEffect(() => {
    if (dynamicGrid && dynamicGrid.length > 0) {
      setGrid(dynamicGrid);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dynamicGrid));
    }
  }, [dynamicGrid]);

  const [paths, setPaths] = useState<{ x: number; y: number }[]>([]);
  const [selectedItem, setSelectedItem] = useState("");

  // Handler for when a shape is drawn
  const handleShapeDrawn = (latlngs: LatLng[] | LatLng[][], layerType: string) => {
    if (showDrawControl && selectedProducts.length > 0 && layerType === 'rectangle') {
      console.log('Product marking:');
      console.log('Selected products:', selectedProducts);
      console.log('Rectangle bounds:', latlngs);
      console.log('Grid before marking:', JSON.stringify(grid));
      setProductPlacements((prev) => ({
        ...prev,
        ...selectedProducts.map((prod) => ({ product: prod, bounds: latlngs }))
      }));
      // Defensive: unwrap if latlngs is [[LatLng, LatLng, LatLng, LatLng]]
      let corners: any[] = [];
      if (Array.isArray(latlngs) && Array.isArray(latlngs[0])) {
        corners = latlngs[0];
      } else if (Array.isArray(latlngs) && latlngs.length === 4) {
        corners = latlngs;
      } else {
        console.error('latlngs/corners is not a valid rectangle corners array:', latlngs);
        return;
      }
      if (!Array.isArray(corners) || corners.length !== 4) {
        console.error('latlngs/corners is not a valid rectangle corners array:', latlngs);
        return;
      }
      // Extract min/max lat/lng from the 4 corners
      const lats = corners.map((pt: any) => pt.lat);
      const lngs = corners.map((pt: any) => pt.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      // Now mark grid cells within this rectangle
      setGrid((prevGrid: any) => {
        const newGrid = prevGrid.map((row: number[], y: number) =>
          row.map((cell: number, x: number) => {
            // Convert grid cell to map coordinates
            const cellLat = y * CELL_SIZE;
            const cellLng = x * CELL_SIZE;
            if (
              cellLat >= minLat && cellLat < maxLat &&
              cellLng >= minLng && cellLng < maxLng
            ) {
              return selectedProducts[selectedProducts.length - 1].value;
            }
            return cell;
          })
        );
        console.log('Grid after marking:', JSON.stringify(newGrid));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGrid));
        return newGrid;
      });
      setSelectedProducts([]);
    }
  };

  const [pathfinder] = useState(() => {
    const pf = new PathFinder();
    pf.setGrid(initialGrid);
    return pf;
  });

  const findPath = useCallback(
    (
      targetProduct: { productId: number; productName: string; coOrds: { x: number; y: number }[] } | null = null
    ) => {
      const selected = targetProduct
        ? targetProduct
        : null;

      if (!selected) return;

      const { coOrds } = selected;

      const tempGrid = grid.map((row, x) =>
        row.map((cell, y) => {
          const isWall = cell === 1;
          return isWall ? 1 : 0;
        })
      );

      pathfinder.setGrid(tempGrid);

      let bestPath: any[] | null = null;
      let shortestLength = Infinity;

      for (const { x, y } of coOrds) {
        const adjustedGrid = tempGrid.map((row: any, i: number) => row.slice());
        adjustedGrid[x][y] = 0;

        pathfinder.setGrid(adjustedGrid);
        const path = pathfinder.findPath(startPos.x, startPos.y, x, y);

        if (path.length > 0 && path.length < shortestLength) {
          bestPath = path;
          shortestLength = path.length;
        }
      }

      if (bestPath) {
        setPaths(bestPath.map(([x, y]) => ({ x, y })));
      }
    },
    [selectedItem, grid]
  );
  const [showDrawControl, setShowDrawControl] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{ value: number; label: string }[]>([]); // for multi-select
  const [productPlacements, setProductPlacements] = useState<{ product: { value: number; label: string }, bounds: any }[]>([]); // {product, bounds}

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1em' }}>
      <button
        style={{ width: 180, alignSelf: 'center', marginBottom: 8 }}
        onClick={() => setShowDrawControl((v) => !v)}
      >
        {showDrawControl ? 'Cancel Product Marking' : 'Mark Product Area'}
      </button>
      {/* Product multi-select dropdown, only show when marking */}
      {showDrawControl && (
        <div style={{ width: 320, alignSelf: 'center', marginBottom: 8 }}>
          <Autocomplete
            multiple
            options={PRODUCT_OPTIONS}
            getOptionLabel={(option) => option.label}
            value={selectedProducts}
            onChange={(_, value) => setSelectedProducts(value)}
            renderInput={(params) => (
              <TextField {...params as any} label="Select Products" placeholder="Products" />
            )}
            disableCloseOnSelect
            isOptionEqualToValue={(option, value) => option.value === value.value}
          />
        </div>
      )}
      <MapContainer
        ref={mapRef as any}
        crs={L.CRS.Simple}
        center={[
          (grid.length * CELL_SIZE) / 2,
          (grid[0].length * CELL_SIZE) / 2,
        ]}
        zoom={-1}
        style={{ height: "80vh", width: "100%", borderRadius: '1em' }}
        maxBounds={[
          [0, 0],
          [grid.length * CELL_SIZE, grid[0].length * CELL_SIZE],
        ]}
      >
        {/* Main grid layer */}
        <GridLayer
          grid={grid}
          startPos={{ x: -1, y: -1 }} // pass dummy value, not used
          paths={paths}
          onCellClick={() => { }}
        />
        {/* Only show product marking draw control */}
        {showDrawControl && (
          <CustomDrawControl onShapeDrawn={handleShapeDrawn} mode="product" />
        )}
        {/* Render product placements as rectangles with product label (Tooltip) */}
        {Array.isArray(productPlacements) && productPlacements.map((placement, idx) => (
          <Rectangle
            key={idx}
            bounds={placement.bounds}
            pathOptions={{ color: '#0ea5e9', weight: 2, fillOpacity: 0.5 }} // match start mark color
          >
            <Tooltip
              direction="bottom"
              offset={[0, 20]}
              permanent
            >
              {placement.product.label}
            </Tooltip>
          </Rectangle>
        ))}
      </MapContainer>
    </div>
  );
};

export default PathfinderMap;
