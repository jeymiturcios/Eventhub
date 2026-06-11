import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-4xl font-bold text-emerald-400 mb-2">
        ¡EventHub Frontend Corriendo!
      </h1>
      <p className="text-gray-400 text-lg mb-6">
        React + Vite + Tailwind CSS listos para el equipo.
      </p>
      <Link 
        to="/mis-entradas" 
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded"
      >
        Ver Mis Entradas
      </Link>
    </div>
  );
}