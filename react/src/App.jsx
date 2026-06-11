import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import MisEntradas from './pages/MisEntradas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mis-entradas" element={<MisEntradas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;