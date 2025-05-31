import { useState, useCallback, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PathFinder from "./utils/pathFinder";
import { MapContainer, Rectangle, Marker, Tooltip } from "react-leaflet";

const CELL_SIZE = 20; // pixels per grid cell

const GridLayer = ({ grid, startPos, paths, itemsDatabase, onCellClick }) => {
  return (
    <>
      {grid.map((row, x) =>
        row.map((cell, y) => {
          const isStart = startPos.x === x && startPos.y === y;
          const isPath = paths.some((p) => p.x === x && p.y === y);
          const isItem = itemsDatabase.some(({ coOrds }) =>
            coOrds.some(({ x: ix, y: iy }) => ix === x && iy === y)
          );

          let color = "#fff";
          if (cell === 1) color = "#333"; // wall
          if (isPath) color = "#4ade80"; // path
          if (isStart) color = "#0ea5e9"; // start
          if (isItem) color = "#f97316"; // item

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

const boundsFromGrid = (x, y) => [
  [x * CELL_SIZE, y * CELL_SIZE],
  [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE],
];

const StorePathfinderMap = () => {
  const initialGrid = [
    [
      1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 101, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 124, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 115, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
      0, 119, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 112, 1, 1, 1, 0, 0, 0, 0, 0, 113, 1, 1, 0,
      0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 102, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 123, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 0, 0, 0, 1, 1, 111, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 110, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 109, 1, 0, 0, 0, 0, 0, 1, 114, 0, 0,
      0, 0, 0, 118, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 122, 1, 1, 1,
    ],
    [
      1, 1, 103, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 120, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 1, 108, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 116, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
      117, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 107, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 121, 1, 1, 1,
    ],
    [
      1, 1, 104, 0, 0, 105, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 106, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
  ];

  const [grid] = useState(initialGrid);
  const itemsDatabase = [
    { productId: 101, productName: "Beer", coOrds: [{ x: 1, y: 2 }] },
    { productId: 102, productName: "Frozen Goods", coOrds: [{ x: 8, y: 3 }] },
    { productId: 103, productName: "Ice", coOrds: [{ x: 14, y: 2 }] },
    { productId: 104, productName: "Household", coOrds: [{ x: 19, y: 2 }] },
    { productId: 105, productName: "ATM", coOrds: [{ x: 19, y: 5 }] },
    { productId: 106, productName: "Lotto", coOrds: [{ x: 20, y: 11 }, { x: 20, y: 12 }] },
    { productId: 107, productName: "Seasonal", coOrds: [{ x: 17, y: 12 }] },
    { productId: 108, productName: "Medical/Health", coOrds: [{ x: 15, y: 8 }] },
    { productId: 109, productName: "Candy", coOrds: [{ x: 13, y: 14 }] },
    { productId: 110, productName: "Jerky & Nuts", coOrds: [{ x: 11, y: 10 }] },
    { productId: 111, productName: "Chips", coOrds: [{ x: 9, y: 9 }] },
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
  const [paths, setPaths] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  const [pathfinder] = useState(() => {
    const pf = new PathFinder();
    pf.setGrid(initialGrid);
    return pf;
  });

  const findPath = useCallback((targetProduct = null) => {
    const selected = targetProduct
      ? targetProduct
      : itemsDatabase.find(item => item.productId === +selectedItem);

    if (!selected) return;

    const { coOrds } = selected;

    const tempGrid = grid.map(row => row.map(cell => (cell === 1 ? 1 : 0)));
    pathfinder.setGrid(tempGrid);

    let bestPath = null;
    let shortestLength = Infinity;

    for (const { x, y } of coOrds) {
      const path = pathfinder.findPath(startPos.x, startPos.y, x, y);
      if (path.length > 0 && path.length < shortestLength) {
        bestPath = path;
        shortestLength = path.length;
      }
    }

    if (bestPath) {
      setPaths(bestPath.map(([x, y]) => ({ x, y })));
    }
  }, [selectedItem, startPos, grid]);


  useEffect(() => {
    if (selectedItem) findPath();
  }, [selectedItem, startPos]);

  const handleCellClick = (x, y) => {
    console.log(x, y);
    if (grid[x][y] !== 1 && grid[x][y] !== 2) {
      setStartPos({ x, y });
      setPaths([]);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1em' }}>
      <select
        onChange={(e) => setSelectedItem(e.target.value)}
        value={selectedItem}
        style={{ minHeight: '30px', padding: '6px 12px' }}
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
        {itemsDatabase.map((item) =>
          item.coOrds.map(({ x, y }) => (
            <Marker
              key={`${item.productId}-${x}-${y}`}
              position={[
                x * CELL_SIZE + CELL_SIZE / 2,
                y * CELL_SIZE + CELL_SIZE / 2,
              ]}
              icon={L.divIcon({
                className: "product-marker",
                html: `<div style="background:#f97316;width:10px;height:10px;border-radius:50%;"></div>`,
                iconSize: [10, 10],
              })}
              eventHandlers={{
                click: () => {
                  findPath(item);
                  setSelectedItem(item.productId);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent={false} sticky>
                {item.productName}
              </Tooltip>
            </Marker>
          ))
        )}

      </MapContainer>
    </div>
  );
};

export default StorePathfinderMap;
