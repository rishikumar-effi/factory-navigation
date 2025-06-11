import { Rectangle, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useSteps } from "../../hooks/useSteps";
import { CELL_SIZE, PRODUCT_COLOR, OBSTACLE_COLOR, PATH_COLOR, LeafletCanvas } from "../LeafletCanvas";

const GridLayer = ({
  grid,
  products,
}: {
  grid: number[][];
  products: { productId: number; productName: string; coOrds: { x: number; y: number }[] }[];
}) => {
  const productCoords = new Set(
    products.flatMap(p => p.coOrds.map(({ x, y }) => `${x},${y}`))
  );

  return (
    <>
      {grid.map((row, x) =>
        row.map((cell, y) => {
          let color = PATH_COLOR;
          if (cell !== 0) color = OBSTACLE_COLOR;
          if (productCoords.has(`${x},${y}`)) color = PRODUCT_COLOR;

          return (
            <Rectangle
              key={`${x}-${y}`}
              bounds={[
                [x * CELL_SIZE, y * CELL_SIZE],
                [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE],
              ]}
              pathOptions={{ color, weight: 1, fillOpacity: color === PATH_COLOR ? 0.3 : 0.8 }}
            />
          );
        })
      )}
      {products.map((product) => {
        if (!product.coOrds.length) return null;
        const { x, y } = product.coOrds[0];
        return (
          <Marker
            key={`${product.productId}-${x}-${y}`}
            position={[
              x * CELL_SIZE + CELL_SIZE / 2,
              y * CELL_SIZE + CELL_SIZE / 2,
            ]}
            icon={L.divIcon({
              className: "product-marker",
              html: `<div style="transform: translateY(-10px)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-2 0 32 32"><path fill="url(#a)" fill-rule="evenodd" d="M23.14 4.06C20.493 1.352 17.298 0 13.555 0 9.812 0 6.617 1.353 3.97 4.06 1.323 6.764 0 10.031 0 13.858c0 3.827 1.323 7.093 3.97 9.8l7.162 7.322a3.389 3.389 0 0 0 4.845 0l7.163-7.323c2.646-2.706 3.97-5.973 3.97-9.8 0-3.826-1.324-7.093-3.97-9.799Zm-9.585 14.996a4.954 4.954 0 0 0 1.945-.396 5.043 5.043 0 0 0 1.65-1.127 5.159 5.159 0 0 0 1.101-1.686 5.268 5.268 0 0 0 .387-1.988 5.315 5.315 0 0 0-.6-2.45 5.222 5.222 0 0 0-.889-1.225A5.094 5.094 0 0 0 15.5 9.057a4.99 4.99 0 0 0-4.77.48 5.096 5.096 0 0 0-1.402 1.434 5.219 5.219 0 0 0-.759 1.874 5.302 5.302 0 0 0 1.057 4.31 5.16 5.16 0 0 0 1.105 1.025 5.04 5.04 0 0 0 1.832.776c.328.066.658.1.992.1Z" clip-rule="evenodd"/><defs><radialGradient id="a" cx="0" cy="0" r="1" gradientTransform="matrix(0 32 -27.1097 0 13.555 0)" gradientUnits="userSpaceOnUse"><stop stop-color="#A2E458"/><stop offset="1" stop-color="#5AD010"/></radialGradient></defs></svg></div>`,
              iconSize: [20, 20],
            })}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent={false} sticky>
              {product.productName}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
};

export const StepThree = () => {
  const { navigationData } = useSteps();
  const { obstaclesArray } = navigationData.step2.data;
  const { productArray } = navigationData.step3.data;

  return (
    <>
    <select
        style={{ minHeight: '30px', padding: '6px 12px', alignSelf: 'center', marginBottom: '1em' }}
      >
        <option value="">Select Item</option>
        {productArray.map(({ productId, productName }) => (
          <option key={productId} value={productId}>
            {productName}
          </option>
        ))}
      </select>
      <LeafletCanvas obstaclesArray={obstaclesArray} navigationData={navigationData}>
        <GridLayer grid={obstaclesArray} products={productArray} />
      </LeafletCanvas>
    </>
  );
};