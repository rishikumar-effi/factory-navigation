import { Box, Zoom } from "@mui/material";
import { useSteps } from "../hooks/useSteps";
import { StepOne, StepTwo, StepThree, StepFour } from "./steps";

export const StepperComponent = () => {
    const { activeStep } = useSteps();

    const stepperComponentsMap = [<StepOne />, <StepTwo />, <StepThree />, <StepFour />];

    return <Zoom in={true} key={activeStep} style={{ transitionDelay: "300ms" }} >
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '20em' }}>
            {stepperComponentsMap[activeStep]}
        </Box>
    </Zoom>
}