'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import NavBar from '../components/NavBar'

interface User {
  username: string;
  clubId: string;
  role: string;
}

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    setIsLoading(false)
  }, [])

  // Don't show NavBar on the login page (root path)
  const showNavBar = !isLoading && user && pathname.split('/').length > 2

  return (
    <>
      {showNavBar && <NavBar />}
      {children}
    </>
  )
} 