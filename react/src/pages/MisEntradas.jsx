import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

export default function MisEntradas() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerMisEntradas();
  }, []);

  const obtenerMisEntradas = async () => {
    try {
      // Temporal: usar usuario ID 1 para pruebas
      // TODO: Reemplazar con el ID del usuario autenticado
      const usuarioId = 1;
      
      const { data, error } = await supabase
        .from('compras')
        .select(`
          compra_id,
          cantidad,
          precio_total,
          fecha_compra,
          codigo_qr,
          tipos_entrada (
            nombre,
            evento_id,
            eventos (
              titulo,
              fecha_inicio
            )
          )
        `)
        .eq('usuario_id', usuarioId)
        .eq('estado_pago', 'completado')
        .order('fecha_compra', { ascending: false });

      if (error) throw error;

      const comprasFormateadas = data.map(compra => ({
        id: compra.compra_id,
        evento_nombre: compra.tipos_entrada?.eventos?.titulo || 'Evento sin nombre',
        fecha: compra.tipos_entrada?.eventos?.fecha_inicio || new Date(),
        tipo_entrada: compra.tipos_entrada?.nombre || 'General',
        cantidad: compra.cantidad,
        precio_total: compra.precio_total,
        codigo_qr: compra.codigo_qr,
        fecha_compra: compra.fecha_compra
      }));

      setCompras(comprasFormateadas);
    } catch (err) {
      console.error('Error al cargar compras:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus entradas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center text-red-600">
          <p>Error al cargar tus entradas: {error}</p>
          <button 
            onClick={obtenerMisEntradas}
            className="mt-4 bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Mis Entradas</h1>
      
      {compras.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tienes entradas compradas aún.</p>
          <Link 
            to="/" 
            className="inline-block mt-4 bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition duration-300"
          >
            Explorar Eventos
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {compras.map((compra) => (
            <div key={compra.id} className="bg-white border rounded-lg p-4 shadow-md hover:shadow-lg transition duration-300">
              <h2 className="text-xl font-semibold mb-2 text-gray-800">{compra.evento_nombre}</h2>
              <p className="text-gray-600">Fecha: {new Date(compra.fecha).toLocaleDateString('es-ES')}</p>
              <p className="text-gray-600">Tipo: {compra.tipo_entrada}</p>
              <p className="text-gray-600">Cantidad: {compra.cantidad}</p>
              <p className="text-gray-600 font-semibold">Total: L {compra.precio_total}</p>
              
              <div className="mt-4 flex justify-center bg-gray-50 p-4 rounded">
                {compra.codigo_qr ? (
                  <QRCodeSVG value={compra.codigo_qr} size={150} />
                ) : (
                  <p className="text-gray-400 text-sm">QR no disponible</p>
                )}
              </div>
              
              <p className="text-xs text-gray-400 mt-2 text-center">
                Comprado el: {new Date(compra.fecha_compra).toLocaleDateString('es-ES')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}