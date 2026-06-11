import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MisEntradas() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const datosPrueba = [
      {
        id: 1,
        evento_nombre: "Concierto de Rock",
        fecha: "2025-06-20",
        cantidad: 2,
        codigo_qr: "ENTRADA-001-2025"
      },
      {
        id: 2,
        evento_nombre: "Festival Electronico",
        fecha: "2025-07-15",
        cantidad: 1,
        codigo_qr: "ENTRADA-002-2025"
      }
    ];
    
    setTimeout(() => {
      setCompras(datosPrueba);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando tus entradas...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Mis Entradas</h1>
      
      {compras.length === 0 ? (
        <p className="text-center text-gray-500">No tienes entradas compradas aun.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {compras.map((compra) => (
            <div key={compra.id} className="border rounded-lg p-4 shadow-md">
              <h2 className="text-xl font-semibold mb-2">{compra.evento_nombre}</h2>
              <p className="text-gray-600"> Fecha: {new Date(compra.fecha).toLocaleDateString("es-ES")}</p>
              <p className="text-gray-600"> Cantidad: {compra.cantidad}</p>
              
              <div className="mt-4 flex justify-center bg-white p-2 rounded">
                <QRCodeSVG value={compra.codigo_qr} size={150} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}