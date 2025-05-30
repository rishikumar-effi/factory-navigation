import { useState, useCallback, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PathFinder from "./utils/pathFinder";
import { MapContainer, Rectangle } from "react-leaflet";

const CELL_SIZE = 20; // pixels per grid cell

const GridLayer = ({ grid, startPos, paths, itemsDatabase, onCellClick }) => {
  return (
    <>
      {grid.map((row, x) =>
        row.map((cell, y) => {
          const isStart = startPos.x === x && startPos.y === y;
          const isPath = paths.some((p) => p.x === x && p.y === y);
          const isItem = Object.values(itemsDatabase).some(
            (i) => i.coOrds.x === x && i.coOrds.y === y
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
      1, 1, 2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 1,
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
      1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
      0, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0, 0, 2, 1, 1, 0,
      0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 0, 0, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 1, 2, 0, 0,
      0, 0, 0, 2, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 2, 1, 1, 1,
    ],
    [
      1, 1, 2, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 2, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 2, 0, 0,
      0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
      2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 2, 1, 1, 1,
    ],
    [
      1, 1, 2, 0, 0, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
  ];
  const [grid] = useState(initialGrid);
  const itemsDatabase = {
    1: { productName: "Beer", coOrds: { x: 1, y: 2 } },
    2: { productName: "Frozen Goods", coOrds: { x: 8, y: 3 } },
    3: { productName: "Ice", coOrds: { x: 14, y: 2 } },
    4: { productName: "Household", coOrds: { x: 19, y: 2 } },
    5: { productName: "ATM", coOrds: { x: 19, y: 5 } },
    6: { productName: "Lotto", coOrds: { x: 20, y: 11 } },
    7: { productName: "Seasonal", coOrds: { x: 17, y: 12 } },
    8: { productName: "Medical/Health", coOrds: { x: 15, y: 8 } },
    9: { productName: "Candy", coOrds: { x: 13, y: 14 } },
    10: { productName: "Jerky & Nuts", coOrds: { x: 11, y: 10 } },
    11: { productName: "Chips", coOrds: { x: 9, y: 9 } },
    12: { productName: "Breakfast", coOrds: { x: 7, y: 12 } },
    13: { productName: "Dry Goods", coOrds: { x: 7, y: 21 } },
    14: { productName: "Specials", coOrds: { x: 13, y: 22 } },
    15: { productName: "Roller Grill", coOrds: { x: 5, y: 10 } },
    16: { productName: "POS", coOrds: { x: 15, y: 22 } },
    17: { productName: "Hot Food", coOrds: { x: 16, y: 25 } },
    18: { productName: "Magazines", coOrds: { x: 13, y: 28 } },
    19: { productName: "Automotive", coOrds: { x: 6, y: 26 } },
    20: { productName: "Tobacco Products", coOrds: { x: 14, y: 36 } },
    21: { productName: "Condiments", coOrds: { x: 18, y: 40 } },
    22: { productName: "Coffee Bar", coOrds: { x: 13, y: 40 } },
    23: { productName: "Frozen Beverages", coOrds: { x: 8, y: 40 } },
    24: { productName: "Soft Drinks", coOrds: { x: 2, y: 40 } },
  };
  const [startPos, setStartPos] = useState({ x: 21, y: 18 });
  const [paths, setPaths] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  const [pathfinder] = useState(() => {
    const pf = new PathFinder();
    pf.setGrid(initialGrid);
    return pf;
  });

  const findPath = useCallback(() => {
    if (!selectedItem || !itemsDatabase[selectedItem]) return;

    const { coOrds } = itemsDatabase[selectedItem];

    const tempGrid = grid.map((row, x) =>
      row.map((cell, y) =>
        cell === 1 || (cell === 2 && !(x === coOrds.x && y === coOrds.y))
          ? 1
          : 0
      )
    );

    pathfinder.setGrid(tempGrid);

    const foundPath = pathfinder.findPath(
      startPos.x,
      startPos.y,
      coOrds.x,
      coOrds.y
    );

    setPaths(foundPath.map(([x, y]) => ({ x, y })));
  }, [selectedItem, startPos, grid]);

  useEffect(() => {
    if (selectedItem) findPath();
  }, [selectedItem, startPos]);

  const handleCellClick = (x, y) => {
    if (grid[x][y] !== 1 && grid[x][y] !== 2) {
      setStartPos({ x, y });
      setPaths([]);
    }
  };

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column', gap: '1em'}}>
      <select
        onChange={(e) => setSelectedItem(e.target.value)}
        value={selectedItem}
        style={{minHeight: '30px', padding: '6px 12px'}}
      >
        <option value="">Select Item</option>
        {Object.entries(itemsDatabase).map(([key, val]) => (
          <option key={key} value={key}>
            {val.productName}
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
        style={{ height: "80vh", width: "100%" }}
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
          style={{borderRadius: '1em'}}
        />
      </MapContainer>
    </div>
  );
};

export default StorePathfinderMap;
