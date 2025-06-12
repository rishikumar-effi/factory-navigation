import { Rectangle, Polygon, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useSteps } from "../../hooks/useSteps";
import { CELL_SIZE, PRODUCT_COLOR, OBSTACLE_COLOR, LeafletCanvas } from "../LeafletCanvas";

const WallLayer = ({ walls }) => (
  <>
    {walls.map((wall, idx) =>
      wall.type === "rectangle" ? (
        <Rectangle
          key={idx}
          bounds={wall.latlngs}
          pathOptions={{ color: OBSTACLE_COLOR, weight: 1, fillOpacity: 0.8 }}
        />
      ) : wall.type === "polygon" ? (
        <Polygon
          key={idx}
          positions={wall.latlngs}
          pathOptions={{ color: OBSTACLE_COLOR, weight: 1, fillOpacity: 0.8 }}
        />
      ) : null
    )}
  </>
);

const ProductLayer = ({ products }) => (
  <>
    {products.map(product =>
      product.coOrds.map(({ x, y }, i) => (
        <Marker
          key={`${product.productId}-${i}`}
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
      ))
    )}
  </>
);

export const StepThree = () => {
  const { navigationData } = useSteps();
  const { walls } = navigationData.step2.data;
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
      <LeafletCanvas navigationData={navigationData}>
        <WallLayer walls={walls} />
        <ProductLayer products={productArray} />
      </LeafletCanvas>
    </>
  );
};