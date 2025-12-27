"use client"

import Link from 'next/link'

export function PublicHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
      <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
        <svg
          width="140"
          height="40"
          viewBox="0 0 200 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 w-auto"
        >
          <style>{`
            @font-face {
              font-family: 'GameOfSquids';
              src: url('/fonts/GameOfSquids.woff2') format('woff2'),
                  url('/fonts/GameOfSquids.woff') format('woff');
              font-weight: 700;
              font-style: bold;
            }
          `}</style>
          {/* Anillo exterior */}
          <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" opacity="0.15"/>
          <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
          {/* Barras de datos */}
          <rect x="14" y="28" width="4" height="10" rx="1.5" fill="#1e40af"/>
          <rect x="20" y="23" width="4" height="15" rx="1.5" fill="#1e40af"/>
          <rect x="26" y="18" width="4" height="20" rx="1.5" fill="#1e40af"/>
          {/* Punto destacado */}
          <circle cx="34" cy="15" r="3" fill="#2563eb"/>
          {/* Texto */}
          <text x="54" y="38" fontFamily="GameOfSquids, sans-serif" fontSize="36" fontWeight="700" fill="#1e40af" letterSpacing="1">Tralok</text>
        </svg>
      </Link>
    </header>
  )
}