import { Rectangle } from "react-leaflet";
import { useSteps } from "../../hooks/useSteps";
import { LeafletCanvas } from "../LeafletCanvas";
import { CELL_SIZE, OBSTACLE_COLOR } from "../LeafletCanvas";

const ObstacleLayer = ({ grid }: { grid: number[][] }) => (
  <>
    {grid.map((row, x) =>
      row.map((cell, y) =>
        cell !== 0 ? (
          <Rectangle
            key={`${x}-${y}`}
            bounds={[
              [x * CELL_SIZE, y * CELL_SIZE],
              [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE],
            ]}
            pathOptions={{ color: OBSTACLE_COLOR, weight: 1, fillOpacity: 0.8 }}
          />
        ) : null
      )
    )}
  </>
);

export const StepTwo = () => {
  const { navigationData } = useSteps();
  const { step2 } = navigationData;
  const { data } = step2;
  const { obstaclesArray } = data;

  return (
   <LeafletCanvas obstaclesArray={obstaclesArray}>
       <ObstacleLayer grid={obstaclesArray} />
   </LeafletCanvas>
  );
};