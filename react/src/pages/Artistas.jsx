import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Artistas() {
  const [artistas, setArtistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [artistaSeleccionado, setArtistaSeleccionado] = useState(null);

  async function obtenerArtistas() {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select(`
          artista_id,
          nombre_artistico,
          genero_musical,
          bio,
          foto_url,
          redes_sociales,
          evento_artistas (
            evento_id,
            hora_presentacion,
            eventos (
              evento_id,
              titulo,
              fecha_inicio,
              fecha_fin,
              lugares (
                nombre,
                ciudad
              )
            )
          )
        `)
        .order('nombre_artistico');

      if (error) throw error;
      setArtistas(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    obtenerArtistas();
  }, []);

  const obtenerEventosProximos = (eventos) => {
    if (!eventos || eventos.length === 0) return [];
    const ahora = new Date();
    return eventos.filter(e => 
      e.eventos && new Date(e.eventos.fecha_inicio) > ahora
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Error: {error}
      </div>
    );
  }

  if (artistaSeleccionado) {
    const eventosProximos = obtenerEventosProximos(artistaSeleccionado.evento_artistas);
    return (
      <div className="container mx-auto p-4">
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => setArtistaSeleccionado(null)}
            className="text-emerald-500 hover:text-emerald-600 flex items-center gap-2"
          >
            ← Volver a lista
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold">{artistaSeleccionado.nombre_artistico}</h1>
          {artistaSeleccionado.genero_musical && (
            <p className="text-emerald-600 text-lg mt-2">{artistaSeleccionado.genero_musical}</p>
          )}
          {artistaSeleccionado.bio && (
            <p className="text-gray-700 mt-4">{artistaSeleccionado.bio}</p>
          )}
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Próximos Eventos</h2>
          {eventosProximos.length === 0 ? (
            <p className="text-gray-500">No hay eventos próximos</p>
          ) : (
            <div className="grid gap-4">
              {eventosProximos.map((ea) => (
                <div key={ea.evento_id} className="border rounded-lg p-4">
                  <h3 className="font-bold text-xl">{ea.eventos.titulo}</h3>
                  <p>📅 {new Date(ea.eventos.fecha_inicio).toLocaleDateString('es-ES')}</p>
                  {ea.eventos.lugares && (
                    <p>📍 {ea.eventos.lugares.nombre} - {ea.eventos.lugares.ciudad}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center flex-1">Artistas</h1>
        <Link 
          to="/" 
          className="text-emerald-500 hover:text-emerald-600 flex items-center gap-2"
        >
          Volver al Inicio
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {artistas.map((artista) => (
          <div 
            key={artista.artista_id} 
            className="border rounded-lg p-4 shadow-md cursor-pointer hover:shadow-lg transition"
            onClick={() => setArtistaSeleccionado(artista)}
          >
            <h2 className="text-xl font-semibold">{artista.nombre_artistico}</h2>
            {artista.genero_musical && (
              <p className="text-emerald-600 text-sm mt-1">{artista.genero_musical}</p>
            )}
            {artista.bio && (
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">{artista.bio.substring(0, 100)}...</p>
            )}
            <button className="mt-3 bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 w-full">
              Ver detalles
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}