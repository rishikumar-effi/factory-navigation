import { Box } from "@mui/material"

export const StepOne = () => {
    return <Box sx={{border: '2.5px dashed #959595', width: '100%', height: '100%', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <input type="file"/>
    </Box>
}