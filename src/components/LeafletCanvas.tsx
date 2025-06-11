import { Box } from "@mui/material";
import L from "leaflet";
import { MapContainer, ImageOverlay } from "react-leaflet";
import { useSteps } from "../hooks/useSteps";
import { useEffect } from "react";

export const CELL_SIZE = 20;
export const PRODUCT_COLOR = "#5c5c5c";
export const OBSTACLE_COLOR = "#333";
export const PATH_COLOR = "#e0e0e0";
export const PATH_HIGHLIGHT_COLOR = "#4ade80";
export const IMAGE_WIDTH = 1000;
export const IMAGE_HEIGHT = 800;

export const LeafletCanvas = ({ obstaclesArray, children, navigationData }) => {
  const imageSrc = navigationData.step1.data.image;

  return <Box sx={{ width: '100%', height: "100%", display: "flex", flexDirection: "column", gap: "1em" }}>
    <MapContainer
      crs={L.CRS.Simple}
      bounds={[
        [0, 0],
        [IMAGE_HEIGHT, IMAGE_WIDTH],
      ]}
      // center={[
      //   (obstaclesArray.length * CELL_SIZE) / 2,
      //   (obstaclesArray[0].length * CELL_SIZE) / 2,
      // ]}
      style={{ minHeight: "80vh", width: "100%", borderRadius: "1em" }}
      zoom={0}
      minZoom={-2}
      maxZoom={4}
      zoomControl={true}
    // maxBounds={[
    //   [0, 0],
    //   [obstaclesArray.length * CELL_SIZE, obstaclesArray[0].length * CELL_SIZE],
    // ]}
    >
      <ImageOverlay
        url={imageSrc}
        bounds={[
          [0, 0],
          [IMAGE_HEIGHT, IMAGE_WIDTH],
        ]}
      />
      {children}
    </MapContainer>
  </Box>
}