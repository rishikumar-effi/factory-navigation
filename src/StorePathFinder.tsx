import { useState, useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PathFinder from "./utils/pathFinder";
import { MapContainer, Rectangle, Marker, Tooltip } from "react-leaflet";

const CELL_SIZE = 20; // pixels per grid cell

const GridLayer = ({ grid, startPos, paths, itemsDatabase, onCellClick }: {grid: any, startPos: any, paths: any, itemsDatabase: any, onCellClick: any}) => {
 console.log(grid, "grid");
 console.log(startPos, "startPos");
 console.log(paths, 'paths');
 console.log(itemsDatabase, 'itemsDatabase');
 console.log(onCellClick, 'onCellClick');
 
  return (
    <>
      {grid[0] && grid[0].length > 0 && grid.map((row: number[], y: number) =>
        row.map((cell: number, x: number) => {
          const isStart = startPos.x === x && startPos.y === y;
          const isPath = paths.some((p: { x: number; y: number }) => p.x === x && p.y === y);
          const isItem = itemsDatabase.some(
            ({ coOrds }: { coOrds: { x: number; y: number }[] }) =>
              coOrds.some(({ x: ix, y: iy }: { x: number; y: number }) => ix === x && iy === y)
          );

          let color = "#fff";
          if (cell === 1) color = "#333"; // wall
          if (isPath) color = "#4ade80"; // path
          if (isStart) color = "#0ea5e9"; // start
          if (isItem) color = "#5c5c5c"; // item

          return (
            <Rectangle
              key={`${x}-${y}`}
              bounds={boundsFromGrid(x, y)}
              pathOptions={{ color, weight: 1, fillOpacity: 0.6 }}
              eventHandlers={{
                click: () => onCellClick(x, y),
              }}
            />
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

const StorePathfinderMap = ({ dynamicGrid }) => {
  const markerRefs = useRef({});

  const lastOpenMarkerRef = useRef<L.Marker | null>(null);

  // Use dynamicGrid if provided, otherwise fallback to initialGrid
  const initialGrid = [];

  const [grid] = useState(dynamicGrid || initialGrid);
  const itemsDatabase = [
    { productId: 101, productName: "Beer", coOrds: [{ x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 2 }] },
    { productId: 102, productName: "Frozen Goods", coOrds: [{ x: 8, y: 3 }, { x: 9, y: 3 }] },
    { productId: 103, productName: "Ice", coOrds: [{ x: 14, y: 2 }] },
    { productId: 104, productName: "Household", coOrds: [{ x: 19, y: 2 }] },
    { productId: 105, productName: "ATM", coOrds: [{ x: 19, y: 5 }] },
    { productId: 106, productName: "Lotto", coOrds: [{ x: 20, y: 11 }, { x: 20, y: 12 }] },
    { productId: 107, productName: "Seasonal", coOrds: [{ x: 17, y: 12 }] },
    { productId: 108, productName: "Medical/Health", coOrds: [{ x: 15, y: 8 }, { x: 15, y: 9 }, { x: 15, y: 7 }, { x: 15, y: 10 }] },
    { productId: 109, productName: "Candy", coOrds: [{ x: 13, y: 14 }, { x: 13, y: 15 }, { x: 13, y: 13 }, { x: 13, y: 12 }] },
    { productId: 110, productName: "Jerky & Nuts", coOrds: [{ x: 11, y: 10 }] },
    { productId: 111, productName: "Chips", coOrds: [{ x: 9, y: 8 }, { x: 9, y: 9 }, { x: 9, y: 10 }, { x: 9, y: 11 }] },
    { productId: 112, productName: "Breakfast", coOrds: [{ x: 7, y: 12 }] },
    { productId: 113, productName: "Dry Goods", coOrds: [{ x: 7, y: 21 }] },
    { productId: 114, productName: "Specials", coOrds: [{ x: 13, y: 22 }] },
    { productId: 115, productName: "Roller Grill", coOrds: [{ x: 5, y: 10 }] },
    { productId: 116, productName: "POS", coOrds: [{ x: 15, y: 22 }] },
    { productId: 117, productName: "Hot Food", coOrds: [{ x: 16, y: 25 }] },
    { productId: 118, productName: "Magazines", coOrds: [{ x: 13, y: 28 }] },
    { productId: 119, productName: "Automotive", coOrds: [{ x: 6, y: 26 }] },
    { productId: 120, productName: "Tobacco Products", coOrds: [{ x: 14, y: 36 }, { x: 15, y: 36 }, { x: 16, y: 36 }, { x: 17, y: 36 }] },
    { productId: 121, productName: "Condiments", coOrds: [{ x: 18, y: 40 }] },
    { productId: 122, productName: "Coffee Bar", coOrds: [{ x: 13, y: 40 }] },
    { productId: 123, productName: "Frozen Beverages", coOrds: [{ x: 8, y: 40 }] },
    { productId: 124, productName: "Soft Drinks", coOrds: [{ x: 2, y: 40 }] },
  ];

  const [startPos, setStartPos] = useState({ x: 21, y: 18 });
  const [paths, setPaths] = useState<{ x: number; y: number }[]>([]);
  const [selectedItem, setSelectedItem] = useState("");

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
        : itemsDatabase.find(item => item.productId === +selectedItem);
  
      if (!selected) return;
  
      const { coOrds } = selected;
  
      const tempGrid = grid.map((row, x) =>
        row.map((cell, y) => {
          const isWall = cell === 1;
          const isItem = itemsDatabase.some(({ coOrds }) =>
            coOrds.some(({ x: ix, y: iy }) => ix === x && iy === y)
          );
          return isWall || isItem ? 1 : 0;
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
    [selectedItem, startPos, grid]
  );


  useEffect(() => {
    if (!selectedItem) return;

    findPath();
    
    const product = itemsDatabase.find((item) => item.productId === +selectedItem);
    if (!product) return;
    
    const { coOrds } = product;
    if (coOrds.length > 0) {
      const key = `${product.productId}-${coOrds[0].x}-${coOrds[0].y}`;
      const newMarker = markerRefs.current[key];

      if (lastOpenMarkerRef.current && lastOpenMarkerRef.current.closeTooltip) {
        lastOpenMarkerRef.current.closeTooltip();
      }

      if (newMarker && newMarker.openTooltip) {
        newMarker.openTooltip();
        lastOpenMarkerRef.current = newMarker;
      }
    }
  }, [selectedItem, startPos]);

  const handleCellClick = (x, y) => {
    if (grid[x][y] !== 1 && grid[x][y] !== 2) {
      setStartPos({ x, y });
      setPaths([]);
    }
  };
  
  const sourceIcon = L.divIcon({
    className: "source-icon",
    html: `<div style="transform: translateY(-10px)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-2 0 32 32"><path fill="url(#b)" fill-rule="evenodd" d="M23.14 4.06C20.493 1.352 17.298 0 13.555 0 9.812 0 6.617 1.353 3.97 4.06 1.323 6.764 0 10.031 0 13.858c0 3.827 1.323 7.093 3.97 9.8l7.162 7.322a3.389 3.389 0 0 0 4.845 0l7.163-7.323c2.646-2.706 3.97-5.973 3.97-9.8 0-3.826-1.324-7.093-3.97-9.799Zm-9.585 14.996a4.954 4.954 0 0 0 1.945-.396 5.043 5.043 0 0 0 1.65-1.127 5.159 5.159 0 0 0 1.101-1.686 5.268 5.268 0 0 0 .387-1.988 5.315 5.315 0 0 0-.6-2.45 5.222 5.222 0 0 0-.889-1.225A5.094 5.094 0 0 0 15.5 9.057a4.99 4.99 0 0 0-4.77.48 5.096 5.096 0 0 0-1.402 1.434 5.219 5.219 0 0 0-.759 1.874 5.302 5.302 0 0 0 1.057 4.31 5.16 5.16 0 0 0 1.105 1.025 5.04 5.04 0 0 0 1.832.776c.328.066.658.1.992.1Z" clip-rule="evenodd"/><defs><radialGradient id="b" cx="0" cy="0" r="1" gradientTransform="matrix(0 32 -27.1097 0 13.555 0)" gradientUnits="userSpaceOnUse"><stop stop-color="#5877e4"/><stop offset="1" stop-color="#103ad1"/></radialGradient></defs></svg></div>`,
    iconSize: [28, 28],
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1em' }}>
      <select
        onChange={(e) => setSelectedItem(e.target.value)}
        value={selectedItem}
        style={{ minHeight: '30px', padding: '6px 12px', alignSelf: 'center' }}
      >
        <option value="">Select Item</option>
        {itemsDatabase.map(({ productId, productName }) => (
          <option key={productId} value={productId}>
            {productName}
          </option>
        ))}
      </select>

      <MapContainer
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
        <GridLayer
          grid={grid}
          startPos={startPos}
          paths={paths}
          itemsDatabase={itemsDatabase}
          onCellClick={handleCellClick}
          />
        <Marker
          position={[
            startPos.x * CELL_SIZE + CELL_SIZE / 2,
            startPos.y * CELL_SIZE + CELL_SIZE / 2,
          ]}
          icon={sourceIcon}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent={false} sticky>
            You're Here
          </Tooltip>
        </Marker>

        {itemsDatabase.map((item) => {
          const { x, y } = item.coOrds[0];
          const key = `${item.productId}-${x}-${y}`;
          return <Marker
            key={`${item.productId}-${x}-${y}`}
            position={[
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
            ]}
            icon={L.divIcon({
              className: "product-marker",
              html: `<div style="transform: translateY(-10px)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-2 0 32 32"><path fill="url(#a)" fill-rule="evenodd" d="M23.14 4.06C20.493 1.352 17.298 0 13.555 0 9.812 0 6.617 1.353 3.97 4.06 1.323 6.764 0 10.031 0 13.858c0 3.827 1.323 7.093 3.97 9.8l7.162 7.322a3.389 3.389 0 0 0 4.845 0l7.163-7.323c2.646-2.706 3.97-5.973 3.97-9.8 0-3.826-1.324-7.093-3.97-9.799Zm-9.585 14.996a4.954 4.954 0 0 0 1.945-.396 5.043 5.043 0 0 0 1.65-1.127 5.159 5.159 0 0 0 1.101-1.686 5.268 5.268 0 0 0 .387-1.988 5.315 5.315 0 0 0-.6-2.45 5.222 5.222 0 0 0-.889-1.225A5.094 5.094 0 0 0 15.5 9.057a4.99 4.99 0 0 0-4.77.48 5.096 5.096 0 0 0-1.402 1.434 5.219 5.219 0 0 0-.759 1.874 5.302 5.302 0 0 0 1.057 4.31 5.16 5.16 0 0 0 1.105 1.025 5.04 5.04 0 0 0 1.832.776c.328.066.658.1.992.1Z" clip-rule="evenodd"/><defs><radialGradient id="a" cx="0" cy="0" r="1" gradientTransform="matrix(0 32 -27.1097 0 13.555 0)" gradientUnits="userSpaceOnUse"><stop stop-color="#A2E458"/><stop offset="1" stop-color="#5AD010"/></radialGradient></defs></svg></div>`,
              iconSize: [20, 20],
              
            })}
            eventHandlers={{
              click: () => {
                findPath(item);
                setSelectedItem(String(item.productId));
              },
            }}
            ref={(ref) => {
              if (ref) markerRefs.current[key] = ref;
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent={false} sticky>
              {item.productName}
            </Tooltip>
          </Marker>
        }
        )}

      </MapContainer>
    </div>
  );
};

export default StorePathfinderMap;
[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
  // [
  //   1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  //   1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 101, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  //   1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  //   1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 124, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  //   1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  // ],
  // [
  //   1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 115, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //   0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
  //   0, 119, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 112, 1, 1, 1, 0, 0, 0, 0, 0, 113, 1, 1, 0,
  //   0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 102, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
  //   0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 123, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 1, 0, 0, 0, 1, 1, 111, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
  //   0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
  //   0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  // ],
  // [
  //   1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 110, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
  //   0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
  //   0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 109, 1, 0, 0, 0, 0, 0, 1, 114, 0, 0,
  //   0, 0, 0, 118, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 122, 1, 1, 1,
  // ],
  // [
  //   1, 1, 103, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
  //   0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 120, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 0, 0, 1, 108, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 116, 0, 0,
  //   0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
  // ],
  // [
  //   1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  //   117, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 107, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  //   1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 121, 1, 1, 1,
  // ],
  // [
  //   1, 1, 104, 0, 0, 105, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 106, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  // ],
  // [
  //   1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
  //   1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  // ],