import { useState, useCallback, useEffect, useRef } from "react";
import L, { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import PathFinder from "../../utils/pathFinder";
import { Rectangle, Marker, Tooltip } from "react-leaflet";
import { CELL_SIZE, PRODUCT_COLOR, OBSTACLE_COLOR, LeafletCanvas, PATH_HIGHLIGHT_COLOR } from "../LeafletCanvas";
import { useSteps } from "../../hooks/useSteps";

function computeGridOrigin(productArray: any[]) {
  let minLat = Infinity, minLng = Infinity;

  productArray.forEach(product => {
    if (product.coOrds && product.coOrds.length > 0) {
      product.coOrds.forEach(pt => {
        if (pt.lat < minLat) minLat = pt.lat;
        if (pt.lng < minLng) minLng = pt.lng;
      });
    }
  });

  if (minLat === Infinity) minLat = 0;
  if (minLng === Infinity) minLng = 0;

  return { minLat, minLng };
}

function latLngToGridCell(pt, minLat, minLng, cellSize) {
  return {
    x: Math.floor((pt.lat - minLat) / cellSize),
    y: Math.floor((pt.lng - minLng) / cellSize),
  };
}

const GridLayer = ({ grid, startPos, paths, products, onCellClick }) => {
  return <>
    {grid.map((row, x) =>
      row.map((cell, y) => {
        const isStart = startPos.x === x && startPos.y === y;
        const isPath = paths.some((p) => p.x === x && p.y === y);
        const isItem = products.some(({ coOrds }) =>
          coOrds.some(({ x: ix, y: iy }) => ix === x && iy === y)
        );

        let color = "transparent";
        if (cell === 1) color = OBSTACLE_COLOR;
        if (isPath) color = PATH_HIGHLIGHT_COLOR;
        if (isStart) color = "#0ea5e9";
        if (isItem) color = PRODUCT_COLOR;

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
};

const boundsFromGrid = (x: number, y: number): LatLngBounds => {
  const bounds = new LatLngBounds(
    [y * CELL_SIZE, x * CELL_SIZE],
    [(y + 1) * CELL_SIZE, (x + 1) * CELL_SIZE]
  );
  return bounds;
};

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

export const StepFour = () => {
  const { navigationData } = useSteps();

  const { productArray } = navigationData.step3.data;

  const grid = navigationData.step4.data.finalArray;

  const markerRefs = useRef({});

  const lastOpenMarkerRef = useRef<L.Marker | null>(null);

  const { minLat, minLng } = computeGridOrigin(productArray);

  const itemsDatabase = productArray.map(product => ({
    ...product,
    coOrds: product.coOrds.map(pt => latLngToGridCell(pt, minLat, minLng, CELL_SIZE)),
  }));

  const [startPos, setStartPos] = useState({ x: 30, y: 50 });
  const [paths, setPaths] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  const [pathfinder] = useState(() => {
    const pf = new PathFinder();
    pf.setGrid(grid);
    return pf;
  });

  const findPath = useCallback((targetProduct = null) => {
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

    let bestPath: any = null;
    let shortestLength = Infinity;

    for (const { x, y } of coOrds) {
      const adjustedGrid = tempGrid.map((row, i) => row.slice());
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
  }, [selectedItem, startPos, grid]);


  useEffect(() => {
    if (!selectedItem) return;
    console.log(selectedItem);
    findPath();

    const product = itemsDatabase.find((item) => item.productId === +selectedItem);
    console.log(product);
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

  const handleCellClick = (x:number, y:number) => {
    console.log(x, y);
    if (grid[x][y] !== 1 && grid[x][y] !== 2) {
      setStartPos({ x, y });
      setPaths([]);
    }
  };

  const sourceIcon = L.divIcon({
    className: "source-icon",
    html: `<div style="transform: translateY(-10px)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-2 0 32 32"><path fill="url(#b)" fill-rule="evenodd" d="M23.14 4.06C20.493 1.352 17.298 0 13.555 0 9.812 0 6.617 1.353 3.97 4.06 1.323 6.764 0 10.031 0 13.858c0 3.827 1.323 7.093 3.97 9.8l7.162 7.322a3.389 3.389 0 0 0 4.845 0l7.163-7.323c2.646-2.706 3.97-5.973 3.97-9.8 0-3.826-1.324-7.093-3.97-9.799Zm-9.585 14.996a4.954 4.954 0 0 0 1.945-.396 5.043 5.043 0 0 0 1.65-1.127 5.159 5.159 0 0 0 1.101-1.686 5.268 5.268 0 0 0 .387-1.988 5.315 5.315 0 0 0-.6-2.45 5.222 5.222 0 0 0-.889-1.225A5.094 5.094 0 0 0 15.5 9.057a4.99 4.99 0 0 0-4.77.48 5.096 5.096 0 0 0-1.402 1.434 5.219 5.219 0 0 0-.759 1.874 5.302 5.302 0 0 0 1.057 4.31 5.16 5.16 0 0 0 1.105 1.025 5.04 5.04 0 0 0 1.832.776c.328.066.658.1.992.1Z" clip-rule="evenodd"/><defs><radialGradient id="b" cx="0" cy="0" r="1" gradientTransform="matrix(0 32 -27.1097 0 13.555 0)" gradientUnits="userSpaceOnUse"><stop stop-color="#5877e4"/><stop offset="1" stop-color="#103ad1"/></radialGradient></defs></svg></div>`,
    iconSize: [28, 28],
  })

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '1em' }}>
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
      <LeafletCanvas navigationData={navigationData}>
        <GridLayer
          grid={grid}
          startPos={startPos}
          paths={paths}
          products={itemsDatabase}
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

        {itemsDatabase.map((item, idx) => {
          if (!item.coOrds || item.coOrds.length === 0) return null;
          const { x, y } = item.coOrds[0];
          if (isNaN(x) || isNaN(y)) return null;
          return <Marker
            key={`${item.productId}-${idx}`}
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
                setSelectedItem(item.productId);
              },
            }}
            ref={(ref) => {
              // if (ref) markerRefs.current[key] = ref;
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent={false} sticky>
              {item.productName}
            </Tooltip>
          </Marker>
        }
        )}
      </LeafletCanvas>
    </div>
  )
};
