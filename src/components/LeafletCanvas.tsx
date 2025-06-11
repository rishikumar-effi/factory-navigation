import { Box } from "@mui/material";
import L from "leaflet";
import { MapContainer } from "react-leaflet";

export const CELL_SIZE = 20;
export const PRODUCT_COLOR = "#5c5c5c";
export const OBSTACLE_COLOR = "#333";
export const PATH_COLOR = "#e0e0e0";
export const PATH_HIGHLIGHT_COLOR = "#4ade80";


export const LeafletCanvas = ({obstaclesArray, children}) => {
    return <Box sx={{ width: '100%', height: "100%", display: "flex", flexDirection: "column", gap: "1em" }}>
      <MapContainer
        crs={L.CRS.Simple}
        center={[
          (obstaclesArray.length * CELL_SIZE) / 2,
          (obstaclesArray[0].length * CELL_SIZE) / 2,
        ]}
        zoom={-1}
        style={{ minHeight: "80vh", width: "100%", borderRadius: "1em" }}
        maxBounds={[
          [0, 0],
          [obstaclesArray.length * CELL_SIZE, obstaclesArray[0].length * CELL_SIZE],
        ]}
      >
        {children}
      </MapContainer>
    </Box>
}