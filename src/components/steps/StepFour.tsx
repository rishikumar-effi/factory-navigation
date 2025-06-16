import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import L, { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import PathFinder from "../../utils/pathFinder";
import { Rectangle, Marker, Tooltip } from "react-leaflet";
import { CELL_SIZE, PRODUCT_COLOR, OBSTACLE_COLOR, LeafletCanvas, PATH_HIGHLIGHT_COLOR } from "../LeafletCanvas";
import { useSteps } from "../../hooks/useSteps";

const GridLayer = ({ grid, converter, startPos, paths, products, onCellClick }) => {
  if (!grid || !converter) {
    console.warn('Grid or converter not available');
    return null;
  }

  return <>
    {grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const y = rowIndex;
        const x = colIndex;
        
        const isStart = startPos.x === x && startPos.y === y;
        const isPath = paths.some((p) => p.x === x && p.y === y);
        const isItem = products.some(({ gridCoOrds }) =>
          gridCoOrds && gridCoOrds.some(({ x: ix, y: iy }) => ix === x && iy === y)
        );

        let color = "transparent";
        let fillOpacity = 0.1;

        if(cell !== 0){
          color = OBSTACLE_COLOR;
          fillOpacity = 0.6;
        }
        
        if (cell === 1) {
          // color = OBSTACLE_COLOR;
          // fillOpacity = 0.6;
        }
        if (isPath) {
          color = PATH_HIGHLIGHT_COLOR;
          fillOpacity = 0.8;
        }
        if (isStart) {
          color = "#0ea5e9";
          fillOpacity = 0.8;
        }
        if (isItem) {
          // color = PRODUCT_COLOR;
          // fillOpacity = 0.6;
        }

        const topLeft = converter.gridToCoord(x, y);
        const bottomRight = converter.gridToCoord(x + 1, y + 1);

        return (
          <Rectangle
            key={`${rowIndex}-${colIndex}`}
            bounds={[
              [topLeft.lat, topLeft.lng],
              [bottomRight.lat, bottomRight.lng]
            ]}
            pathOptions={{ color, weight: 1, fillOpacity }}
            eventHandlers={{
              click: () => onCellClick(x, y),
            }}
          />
        );
      })
    )}
  </>
};

export const StepFour = () => {
  const { navigationData } = useSteps();

  const { productArray } = navigationData.step3.data || {};
  const { finalArray: grid, gridInfo, converter } = navigationData.step4.data || {};

  const markerRefs = useRef({});
  const lastOpenMarkerRef = useRef<L.Marker | null>(null);

  const itemsDatabase = useMemo(() => {
    if (!productArray || !converter) return [];
    
    return productArray.map(product => {
      const gridCoOrds = [];
      
      if (product.coOrds) {
        product.coOrds.forEach(pt => {
          try {
            const gridPos = converter.coordToGrid(pt.lat, pt.lng);
            gridCoOrds.push(gridPos);
          } catch (error) {
            console.warn('Failed to convert coordinate to grid:', pt, error);
          }
        });
      }
      
      return {
        ...product,
        gridCoOrds
      };
    });
  }, [productArray, converter]);

  const [startPos, setStartPos] = useState({ x: 25, y: 4 });
  const [paths, setPaths] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  const [pathfinder] = useState(() => {
    const pf = new PathFinder();
    if (grid) pf.setGrid(grid);
    return pf;
  });

  useEffect(() => {
    if (grid && pathfinder) {
      pathfinder.setGrid(grid);
    }
  }, [grid, pathfinder]);

  const findPath = useCallback((targetProduct = null) => {
    if (!grid || !converter) {
      console.warn('Grid not available for pathfinding');
      return;
    }

    const selected = targetProduct
      ? targetProduct
      : itemsDatabase.find(item => item.productId === +selectedItem);

    if (!selected || !selected.gridCoOrds || selected.gridCoOrds.length === 0) {
      console.warn('No valid target selected or no grid coordinates');
      return;
    }

    const { gridCoOrds } = selected;

    const tempGrid = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const y = rowIndex;
        const x = colIndex;
        
        const isWall = cell === 1;
        const isOtherItem = itemsDatabase.some(({ gridCoOrds: coords, productId }) => 
          productId !== selected.productId && 
          coords && coords.some(({ x: ix, y: iy }) => ix === x && iy === y)
        );
        return isWall || isOtherItem ? 1 : 0;
      })
    );

    let bestPath: any = null;
    let shortestLength = Infinity;

    for (const { x, y } of gridCoOrds) {
      const adjustedGrid = tempGrid.map((row) => row.slice());
      if (adjustedGrid[y] && adjustedGrid[y][x] !== undefined) {
        adjustedGrid[y][x] = 0;
      }

      pathfinder.setGrid(adjustedGrid);
      
      try {
        const path = pathfinder.findPath(startPos.x, startPos.y, x, y);
        
        if (path && path.length > 0 && path.length < shortestLength) {
          bestPath = path;
          shortestLength = path.length;
        }
      } catch (error) {
        console.warn('Pathfinding failed for target:', { x, y }, error);
      }
    }

    if (bestPath && bestPath.length > 0) {
      setPaths(bestPath.map(([x, y]) => ({ x, y })));
    } else {
      console.warn('No path found to target');
      setPaths([]);
    }
  }, [selectedItem, startPos, grid, itemsDatabase, pathfinder, converter]);

  useEffect(() => {
    if (!selectedItem) return;
    
    findPath();

    const product = itemsDatabase.find((item) => item.productId === +selectedItem);
    if (!product || !product.gridCoOrds || product.gridCoOrds.length === 0) return;

    const { gridCoOrds } = product;
    const key = `${product.productId}-${gridCoOrds[0].x}-${gridCoOrds[0].y}`;
    const newMarker = markerRefs.current[key];

    if (lastOpenMarkerRef.current && lastOpenMarkerRef.current.closeTooltip) {
      lastOpenMarkerRef.current.closeTooltip();
    }

    if (newMarker && newMarker.openTooltip) {
      newMarker.openTooltip();
      lastOpenMarkerRef.current = newMarker;
    }
  }, [selectedItem, startPos, findPath]);

  const handleCellClick = (x: number, y: number) => {
    console.log('Cell clicked:', x, y);
    if (grid && grid[y] && grid[y][x] !== undefined && grid[y][x] === 0) {
      setStartPos({ x, y });
      setPaths([]);
    }
  };

  const sourceIcon = L.divIcon({
    className: "source-icon",
    html: `<div style="transform: translateY(-10px)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-2 0 32 32"><path fill="url(#b)" fill-rule="evenodd" d="M23.14 4.06C20.493 1.352 17.298 0 13.555 0 9.812 0 6.617 1.353 3.97 4.06 1.323 6.764 0 10.031 0 13.858c0 3.827 1.323 7.093 3.97 9.8l7.162 7.322a3.389 3.389 0 0 0 4.845 0l7.163-7.323c2.646-2.706 3.97-5.973 3.97-9.8 0-3.826-1.324-7.093-3.97-9.799Zm-9.585 14.996a4.954 4.954 0 0 0 1.945-.396 5.043 5.043 0 0 0 1.65-1.127 5.159 5.159 0 0 0 1.101-1.686 5.268 5.268 0 0 0 .387-1.988 5.315 5.315 0 0 0-.6-2.45 5.222 5.222 0 0 0-.889-1.225A5.094 5.094 0 0 0 15.5 9.057a4.99 4.99 0 0 0-4.77.48 5.096 5.096 0 0 0-1.402 1.434 5.219 5.219 0 0 0-.759 1.874 5.302 5.302 0 0 0 1.057 4.31 5.16 5.16 0 0 0 1.105 1.025 5.04 5.04 0 0 0 1.832.776c.328.066.658.1.992.1Z" clip-rule="evenodd"/><defs><radialGradient id="b" cx="0" cy="0" r="1" gradientTransform="matrix(0 32 -27.1097 0 13.555 0)" gradientUnits="userSpaceOnUse"><stop stop-color="#5877e4"/><stop offset="1" stop-color="#103ad1"/></radialGradient></defs></svg></div>`,
    iconSize: [28, 28],
  });

  // Loading state
  if (!grid || !converter) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading grid data...</p>
      </div>
    );
  }

  const validateStartPosition = () => {
    if (grid && (startPos.y >= grid.length || startPos.x >= grid[0]?.length || startPos.y < 0 || startPos.x < 0)) {
      console.warn('Invalid start position, resetting to safe position');
      setStartPos({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    validateStartPosition();
  }, [grid, startPos]);

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
          converter={converter}
          startPos={startPos}
          paths={paths}
          products={itemsDatabase}
          onCellClick={handleCellClick}
        />

        {converter && (() => {
          const startLatLng = converter.gridToCoord(startPos.x, startPos.y);
          return (
            <Marker
              position={[startLatLng.lat, startLatLng.lng]}
              icon={sourceIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent={false} sticky>
                You're Here
              </Tooltip>
            </Marker>
          );
        })()}

        {itemsDatabase.map((item, idx) => {
          if (!item.gridCoOrds || item.gridCoOrds.length === 0 || !converter) return null;
          
          const { x, y } = item.gridCoOrds[0];
          if (isNaN(x) || isNaN(y)) return null;
          
          const markerLatLng = converter.gridToCoord(x, y);
          const key = `${item.productId}-${x}-${y}`;
          
          return (
            <Marker
              key={key}
              position={[markerLatLng.lat, markerLatLng.lng]}
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
          );
        })}
      </LeafletCanvas>
    </div>
  );
};