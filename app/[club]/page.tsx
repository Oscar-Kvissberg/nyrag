'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClubPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      // If not logged in, redirect to login page
      router.push('/login')
    }
  }, [router])

  return null // This page will redirect, so no need to render anything
} 