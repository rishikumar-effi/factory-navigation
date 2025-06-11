import { useContext } from "react"
import { StepContext } from "../context/StepContext";
import { StepContextType } from "../context/stepRelatedTypes";

export const useSteps = (): StepContextType => {
    const context = useContext(StepContext);

    if(!context){
        throw new Error("useSteps must be used within a StepProvider")
    }

    return context;
}