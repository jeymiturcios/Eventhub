import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { supabase } from '../lib/supabase';
import Navbar from '../components/navbard';

export default function MisEntradas() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function cargarEntradas() {
    try {
      setLoading(true);

      // Usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log('Usuario Auth:', user);

      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Buscar usuario interno por email
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('usuario_id, email')
        .eq('email', user.email)
        .single();

      console.log('Usuario BD:', usuario);

      if (usuarioError) throw usuarioError;

      // Buscar compras
      const { data: comprasData, error: comprasError } = await supabase
        .from('compras')
        .select('*')
        .eq('usuario_id', usuario.usuario_id)
        .eq('estado_pago', 'completado');

      console.log('Compras encontradas:', comprasData);

      if (comprasError) throw comprasError;

      setCompras(comprasData || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarEntradas();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        Cargando entradas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
  <div className="page-shell">
    <Navbar />

    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <p className="text-emerald-400/90 text-sm font-medium">
          Mis boletos
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          Mis Entradas
        </h1>
      </div>

      {compras.length === 0 ? (
        <section className="card p-8 text-center">
          <p className="text-slate-400">
            No tienes entradas compradas todavía.
          </p>

          <Link
            to="/"
            className="btn-primary inline-flex mt-5"
          >
            Explorar eventos
          </Link>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {compras.map((compra) => (
            <article
              key={compra.compra_id}
              className="card p-5 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Compra #{compra.compra_id}
                  </h2>

                  <p className="text-slate-400 text-sm">
                    Código de acceso
                  </p>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25">
                  Confirmada
                </span>
              </div>

              <div className="grid md:grid-cols-[1fr_auto] gap-5 items-center">
                <div className="space-y-2">
                  <p className="text-slate-300">
                    <span className="text-slate-500">
                      Cantidad:
                    </span>{' '}
                    {compra.cantidad}
                  </p>

                  <p className="text-slate-300">
                    <span className="text-slate-500">
                      Total:
                    </span>{' '}
                    L {compra.precio_total}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">
                      Código QR
                    </p>

                    <p className="text-emerald-300 text-sm break-all">
                      {compra.codigo_qr}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  <QRCode
                    value={compra.codigo_qr}
                    size={170}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  </div>
)
}