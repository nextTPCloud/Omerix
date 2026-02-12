export default function FirmarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Firma de Documento</h1>
            <span className="text-sm text-gray-500">Omerix ERP</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto py-8 px-4">
          {children}
        </main>
        <footer className="text-center py-6 text-sm text-gray-400">
          Firma electronica segura · Omerix ERP
        </footer>
      </body>
    </html>
  );
}
