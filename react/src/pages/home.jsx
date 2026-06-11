import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-4xl font-bold text-emerald-400 mb-2">
        ¡EventHub Frontend Corriendo!
      </h1>
      <div className="flex gap-8">
        <Link 
          to="/mis-entradas" 
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          🎟️ Mis Entradas
        </Link>
        <Link 
          to="/artistas" 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          🎤 Artistas
        </Link>
      </div>
    </div>
  );
}