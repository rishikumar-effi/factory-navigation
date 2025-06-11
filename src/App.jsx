import './App.css';
import { RouterProvider } from 'react-router-dom';
import MyRoutes from './config/MyRoutes';

function App() {
  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <RouterProvider router={MyRoutes} />
    </div>
  );
}

export default App;
