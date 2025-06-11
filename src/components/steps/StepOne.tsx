import { useEffect, useState } from "react";
import { Box } from "@mui/material";

export const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export const StepOne = () => {
    const [imageSrc, setImageSrc] = useState("");

    const imageHandler = async (event) => {
        const file = event.target.files[0];

        try{
            const base64 = await fileToBase64(file);

            if(base64){
                console.log('testing');
                setImageSrc(base64);
            }
        }
        catch(error){
            console.log(error);
        }
    }

    return <Box sx={{ border: '2.5px dashed #959595', width: '100%', height: '100%', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {imageSrc && <Box component="img" sx={{width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: -1, objectFit: 'contain'}} src={imageSrc}></Box>}
        {imageSrc && <Box sx={{width: '100%', height: '100%', background: '#000', position: 'absolute', inset: 0, zIndex: 1, maskImage: 'radial-gradient(#00000066 10%, #00000000)'}}></Box>}
        <input type="file" onChange={imageHandler} style={{zIndex: 1}}/>
    </Box>
}