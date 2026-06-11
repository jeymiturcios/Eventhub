import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import MisEntradas from './pages/MisEntradas';
import Artistas from './pages/Artistas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mis-entradas" element={<MisEntradas />} />
        <Route path="/artistas" element={<Artistas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;