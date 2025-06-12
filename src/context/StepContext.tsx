import { createContext, useReducer, useState, useRef, useCallback } from 'react';

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
            walls: []
        }, valid: false
    },
    step3: {
        data: {
            productArray: [
                { productId: 101, productName: "Beer", coOrds: [] },
                { productId: 102, productName: "Frozen Goods", coOrds: [] },
                { productId: 103, productName: "Ice", coOrds: [] },
                { productId: 104, productName: "Household", coOrds: [] },
                { productId: 105, productName: "ATM", coOrds: [] },
                { productId: 106, productName: "Lotto", coOrds: [] },
                { productId: 107, productName: "Seasonal", coOrds: [] },
                { productId: 108, productName: "Medical/Health", coOrds: [] },
                { productId: 109, productName: "Candy", coOrds: [] },
                { productId: 110, productName: "Jerky & Nuts", coOrds: [] },
                { productId: 111, productName: "Chips", coOrds: [] },
                { productId: 112, productName: "Breakfast", coOrds: [] },
                { productId: 113, productName: "Dry Goods", coOrds: [] },
                { productId: 114, productName: "Specials", coOrds: [] },
                { productId: 115, productName: "Roller Grill", coOrds: [] },
                { productId: 116, productName: "POS", coOrds: [] },
                { productId: 117, productName: "Hot Food", coOrds: [] },
                { productId: 118, productName: "Magazines", coOrds: [] },
                { productId: 119, productName: "Automotive", coOrds: [] },
                { productId: 120, productName: "Tobacco Products", coOrds: [] },
                { productId: 121, productName: "Condiments", coOrds: [] },
                { productId: 122, productName: "Coffee Bar", coOrds: [] },
                { productId: 123, productName: "Frozen Beverages", coOrds: [] },
                { productId: 124, productName: "Soft Drinks", coOrds: [] },
            ],
            productWalls: []
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

    const [navigationData, dispatch] = useReducer(reducer, initialRef.current, (init) => init);

    const continueHandlerRef = useRef<(() => void | Promise<void>)>(null);

    const setNxtBtnState = (state: boolean) => setIsNextActive(state);

    const setContinueHandler = useCallback((handler: () => void | Promise<void>) => {
        continueHandlerRef.current = handler;
    }, [])

    const handleNext = useCallback(async () => {
        if (continueHandlerRef.current) {
            await continueHandlerRef.current();
        }

        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }, []);

    const handleBack = useCallback(() => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }, []);

    const handleReset = useCallback(() => {
        setActiveStep(0);
    }, []);

    const updateStepData = useCallback((step: keyof NavigationDataType, data: any) => {
        dispatch({ type: 'UPDATE_STEP_DATA', step, payload: data });
    }, []);

    const setStepValidity = useCallback((step: keyof NavigationDataType, valid: boolean) => {
        dispatch({ type: 'SET_STEP_VALIDITY', step, valid });
    }, []);

    const values = {
        activeStep, toNext: handleNext, toPrevious: handleBack, reset: handleReset, setNxtBtnState, updateStepData, setStepValidity, navigationData, setContinueHandler
    }

    return (
        <StepContext.Provider value={values}>
            <Box component="main" sx={{ m: 2 }}>
                <Box component="section" sx={{ display: 'flex', padding: '2rem', alignItems: 'center', gap: 4 }}>
                    <Box component="aside" sx={{ maxWidth: 300 }}>
                        <Typography variant="h1" style={{ fontSize: '32px', textAlign: 'center', letterSpacing: '1px', marginBottom: '1em' }}>Floor Navigation</Typography>
                        <Stepper activeStep={activeStep} orientation="vertical">
                            {steps.map((step, index) => (
                                <Step sx={{ '& .MuiStepIcon-root.Mui-completed': { color: '#88dc3e' }, '& .MuiStepLabel-label': { color: '#cecece', fontSize: '16px' }, '& .MuiStepLabel-label.Mui-completed': { color: '#cecece' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff' }, '& .MuiTypography-root': { textAlign: 'left', color: '#bdbdbd', fontSize: '14px' } }} key={step.label}>
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
                                                disabled={!isNextActive}
                                                variant="contained"
                                                onClick={handleNext}
                                                sx={{ mt: 1, mr: 1, '&.Mui-disabled': { background: '#2d68a3', opacity: '.8', color: '#fff', cursor: 'not-allowed' } }}
                                            >
                                                {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                            </Button>
                                            {index !== 0 && <Button
                                                onClick={handleBack}
                                                sx={{ mt: 1, mr: 1 }}
                                            >
                                                Back
                                            </Button>}

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