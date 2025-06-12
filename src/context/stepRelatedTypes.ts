export type GridType = number[][];

export type CoOrd = { x: number; y: number };

export type Product = {
  productId: number;
  productName: string;
  coOrds: CoOrd[];
};

export type NavigationDataType = {
    step1: { data: { image: string }, valid: boolean },
    step2: { data: { walls: Array<any> }, valid: boolean },
    step3: { data: { productArray: Product[] }, valid: boolean },
    step4: { data: { finalArray: [] }, valid: boolean }
}

export interface StepContextType {
    toNext: () => void,
    toPrevious: () => void,
    reset: () => void,
    activeStep: number,
    setNxtBtnState: (state: boolean) => void,
    updateStepData: (step: any, data: any) => void,
    setStepValidity: (step: any, valid: boolean) => void,
    navigationData: {
        step1: { data: {image: any}, valid: boolean},
        step2: { data: {walls: Array<any>}, valid: boolean },
        step3: { data: {productArray: Product[]}, valid: boolean },
        step4: {data: {finalArray: any}, valid: boolean}
    },
    setContinueHandler: (handler: () => void | Promise<void>) => void
}