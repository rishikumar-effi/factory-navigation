import { createContext, useReducer, useState, useRef } from 'react';

import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { StepContextType, NavigationDataType } from './stepRelatedTypes';

export const StepContext = createContext<StepContextType | undefined>(undefined);

type Action =
    | { type: 'UPDATE_STEP_DATA'; step: keyof NavigationDataType; payload: any }
    | { type: 'SET_STEP_VALIDITY'; step: keyof NavigationDataType; valid: boolean }

const defaultValue: NavigationDataType = {
    step1: { data: { image: "" }, valid: false },
    step2: {
        data: {
            obstaclesArray: [
                [
                    1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
                ],
                [
                    1, 1, 101, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 124, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                    1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
                ],
                [
                    1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 115, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
                ],
                [
                    1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
                    0, 119, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 112, 1, 1, 1, 0, 0, 0, 0, 0, 113, 1, 1, 0,
                    0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 102, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
                    0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 123, 1, 1, 1,
                ],
                [
                    1, 1, 1, 1, 0, 0, 0, 1, 1, 111, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
                    0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
                    0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
                ],
                [
                    1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 110, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
                    0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
                    0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 109, 1, 0, 0, 0, 0, 0, 1, 114, 0, 0,
                    0, 0, 0, 118, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 122, 1, 1, 1,
                ],
                [
                    1, 1, 103, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0,
                    0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 120, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 0, 0, 1, 108, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 116, 0, 0,
                    0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
                ],
                [
                    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                    117, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 107, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 121, 1, 1, 1,
                ],
                [
                    1, 1, 104, 0, 0, 105, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                ],
                [
                    1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 106, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
                ],
                [
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1,
                    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                ],
            ]
        }, valid: false
    },
    step3: {
        data: {
            productArray: [
                { productId: 101, productName: "Beer", coOrds: [{ x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 2 }] },
                { productId: 102, productName: "Frozen Goods", coOrds: [{ x: 8, y: 3 }, { x: 9, y: 3 }] },
                { productId: 103, productName: "Ice", coOrds: [{ x: 14, y: 2 }] },
                { productId: 104, productName: "Household", coOrds: [{ x: 19, y: 2 }] },
                { productId: 105, productName: "ATM", coOrds: [{ x: 19, y: 5 }] },
                { productId: 106, productName: "Lotto", coOrds: [{ x: 20, y: 11 }, { x: 20, y: 12 }] },
                { productId: 107, productName: "Seasonal", coOrds: [{ x: 17, y: 12 }] },
                { productId: 108, productName: "Medical/Health", coOrds: [{ x: 15, y: 8 }, { x: 15, y: 9 }, { x: 15, y: 7 }, { x: 15, y: 10 }] },
                { productId: 109, productName: "Candy", coOrds: [{ x: 13, y: 14 }, { x: 13, y: 15 }, { x: 13, y: 13 }, { x: 13, y: 12 }] },
                { productId: 110, productName: "Jerky & Nuts", coOrds: [{ x: 11, y: 10 }] },
                { productId: 111, productName: "Chips", coOrds: [{ x: 9, y: 8 }, { x: 9, y: 9 }, { x: 9, y: 10 }, { x: 9, y: 11 }] },
                { productId: 112, productName: "Breakfast", coOrds: [{ x: 7, y: 12 }] },
                { productId: 113, productName: "Dry Goods", coOrds: [{ x: 7, y: 21 }] },
                { productId: 114, productName: "Specials", coOrds: [{ x: 13, y: 22 }] },
                { productId: 115, productName: "Roller Grill", coOrds: [{ x: 5, y: 10 }] },
                { productId: 116, productName: "POS", coOrds: [{ x: 15, y: 22 }] },
                { productId: 117, productName: "Hot Food", coOrds: [{ x: 16, y: 25 }] },
                { productId: 118, productName: "Magazines", coOrds: [{ x: 13, y: 28 }] },
                { productId: 119, productName: "Automotive", coOrds: [{ x: 6, y: 26 }] },
                { productId: 120, productName: "Tobacco Products", coOrds: [{ x: 14, y: 36 }, { x: 15, y: 36 }, { x: 16, y: 36 }, { x: 17, y: 36 }] },
                { productId: 121, productName: "Condiments", coOrds: [{ x: 18, y: 40 }] },
                { productId: 122, productName: "Coffee Bar", coOrds: [{ x: 13, y: 40 }] },
                { productId: 123, productName: "Frozen Beverages", coOrds: [{ x: 8, y: 40 }] },
                { productId: 124, productName: "Soft Drinks", coOrds: [{ x: 2, y: 40 }] },
            ]
        }, valid: false
    },
    step4: { data: { finalArray: [] }, valid: false }
}

const steps = [
    {
        label: 'Upload your floor map',
        description: 'Upload the image of your floor map which you need to navigate',
    },
    {
        label: 'Mark Obstacles',
        description: 'Draw the obstacles on the map using the tools provided in the toolbar',
    },
    {
        label: 'Mark the Product',
        description: 'Select the product in the dropdown and draw the product, using the tools provided in the toolbar',
    },
    {
        label: 'Map and Product view',
        description: 'Click to navigate to the product',
    },
];

const reducer = (state: NavigationDataType, action: Action): NavigationDataType => {
    switch (action.type) {
        case 'UPDATE_STEP_DATA':
            return {
                ...state,
                [action.step]: {
                    ...state[action.step],
                    data: {
                        ...state[action.step].data,
                        ...action.payload,
                    }
                }
            };
        case "SET_STEP_VALIDITY":
            return {
                ...state,
                [action.step]: {
                    ...state[action.step],
                    valid: action.valid,
                }
            }
        default:
            return state;
    }
}

export const StepProvider = ({ children }) => {
    const initialRef = useRef(defaultValue);

    const [activeStep, setActiveStep] = useState<number>(0);

    const [isNextActive, setIsNextActive] = useState<boolean>(false);

    const setNxtBtnState = (state: boolean) => setIsNextActive(state);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    const updateStepData = (step: keyof NavigationDataType, data: any) => {
        dispatch({ type: 'UPDATE_STEP_DATA', step, payload: data });
    };

    const setStepValidity = (step: keyof NavigationDataType, valid: boolean) => {
        dispatch({ type: 'SET_STEP_VALIDITY', step, valid });
    };

    const [navigationData, dispatch] = useReducer(reducer, initialRef.current, (init) => init);

    const values = {
        activeStep, toNext: handleNext, toPrevious: handleBack, reset: handleReset, setNxtBtnState, updateStepData, setStepValidity, navigationData
    }

    return (
        <StepContext.Provider value={values}>
            <Box component="main" sx={{m: 2}}>
                <Box component="section" sx={{ display: 'flex', padding: '2rem', alignItems: 'center', gap: 4 }}>
                    <Box component="aside" sx={{ maxWidth: 300 }}>
                        <Typography variant="h1" style={{ fontSize: '32px', textAlign: 'center', letterSpacing: '1px', marginBottom: '1em' }}>Floor Navigation</Typography>
                        <Stepper activeStep={activeStep} orientation="vertical">
                            {steps.map((step, index) => (
                                <Step sx={{'& .MuiStepIcon-root.Mui-completed': {color: '#88dc3e'}, '& .MuiStepLabel-label': { color: '#cecece', fontSize: '16px' }, '& .MuiStepLabel-label.Mui-completed': { color: '#cecece' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff' }, '& .MuiTypography-root': { textAlign: 'left', color: '#bdbdbd', fontSize: '14px' }}} key={step.label}>
                                    <StepLabel
                                        optional={
                                            index === steps.length - 1 ? (
                                                <Typography variant="caption">Last step</Typography>
                                            ) : null
                                        }
                                    >
                                        {step.label}
                                    </StepLabel>
                                    <StepContent>
                                        <Typography>{step.description}</Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Button
                                                variant="contained"
                                                onClick={handleNext}
                                                sx={{ mt: 1, mr: 1 }}
                                            >
                                                {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                            </Button>
                                            <Button
                                                disabled={index === 0}
                                                onClick={handleBack}
                                                sx={{ mt: 1, mr: 1 }}
                                            >
                                                Back
                                            </Button>
                                        </Box>
                                    </StepContent>
                                </Step>
                            ))}
                        </Stepper>
                        {activeStep === steps.length && (
                            <Paper square elevation={0} sx={{ p: 3 }}>
                                <Typography>All steps completed - you&apos;re finished</Typography>
                                <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                                    Reset
                                </Button>
                            </Paper>
                        )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </StepContext.Provider>
    );
}