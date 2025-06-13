import { lazy, Suspense } from "react";
import { Box, Typography, Zoom } from "@mui/material";
import { useSteps } from "../hooks/useSteps";

const StepOne = lazy(() => import('./steps/StepOne').then(module => ({ default: module.StepOne })));

const StepTwo = lazy(() => import('./steps/StepTwo').then(module => ({ default: module.StepTwo })));

const StepThree = lazy(() => import('./steps/StepThree').then(module => ({ default: module.StepThree })));

const StepFour = lazy(() => import('./steps/StepFour').then(module => ({ default: module.StepFour })));

export const StepperComponent = () => {
    const { activeStep } = useSteps();

    const stepperComponentsMap = [<StepOne />, <StepTwo />, <StepThree />, <StepFour />];

    return <Zoom in={true} key={activeStep} style={{ transitionDelay: "300ms" }} >
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '20em' }}>
            <Suspense fallback={<Typography>Loading...</Typography>}>
                {stepperComponentsMap[activeStep]}
            </Suspense>
        </Box>
    </Zoom>
}