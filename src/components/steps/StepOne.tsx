import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { MapContainer, ImageOverlay } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSteps } from "../../hooks/useSteps";

const IMAGE_WIDTH = 1000;
const IMAGE_HEIGHT = 800;

export const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export const StepOne = () => {
    const {updateStepData, navigationData, setNxtBtnState, setStepValidity, setContinueHandler} = useSteps();
    const [imageSrc, setImageSrc] = useState(navigationData.step1.data.image);

    useEffect(() => {
        if (!imageSrc) return;

        const handler = () => {
            updateStepData("step1", { image: imageSrc });
        };

        setContinueHandler(handler);

        return () => {
            setContinueHandler(() => {});
        };
    }, [imageSrc]);

    const imageHandler = async (event: any) => {
        const file = event.target.files[0];

        if (!file) {
            // updateStepData('step1', {image: ''});
            setStepValidity('step1', false);
            setNxtBtnState(false)
            setImageSrc("");
            return;
        }

        try {
            const base64 = await fileToBase64(file);

            if (base64) {
                // updateStepData('step1', {image: base64});
                setStepValidity('step1', true);
                setNxtBtnState(true);
                setImageSrc(base64);
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    return <>
        <input type="file" onChange={imageHandler} style={{marginBottom: '12px'}}/>

        {imageSrc && <Box sx={{ border: '2.5px dashed #959595', width: '100%', height: '100%', minHeight: '25em', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <MapContainer
                crs={L.CRS.Simple}
                bounds={[
                    [0, 0],
                    [IMAGE_HEIGHT, IMAGE_WIDTH],
                ]}
                style={{ height: "100%", width: "100%" }}
                zoom={0}
                minZoom={-2}
                maxZoom={4}
                zoomControl={true}
            >
                <ImageOverlay
                    url={imageSrc}
                    bounds={[
                        [0, 0],
                        [IMAGE_HEIGHT, IMAGE_WIDTH],
                    ]}
                />
            </MapContainer>
        </Box>}
    </>
}