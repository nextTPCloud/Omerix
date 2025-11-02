"use client"

import { LogoLink } from './LogoLink'

export function PublicHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
      <LogoLink />
    </header>
  )
}