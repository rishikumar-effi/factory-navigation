import './App.css'
import { StepProvider } from './context/StepContext'
import { StepperComponent } from './components/StepperComponent'

function App() {
  return (
    <StepProvider>
      <StepperComponent/>
    </StepProvider>
  )
}

export default App
