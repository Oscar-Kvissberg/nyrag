'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HomeIcon, EnvelopeIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useRef, useEffect, useState } from 'react'
import Cookies from 'js-cookie'

interface User {
  username: string;
  clubId: string;
  role: string;
}

export default function NavBar() {
    const pathname = usePathname()
    const router = useRouter()
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
    const homeRef = useRef<HTMLAnchorElement>(null)
    const mailRef = useRef<HTMLAnchorElement>(null)
    const statsRef = useRef<HTMLAnchorElement>(null)
    const adminRef = useRef<HTMLAnchorElement>(null)
    const [user, setUser] = useState<User | null>(null)

    // Extract club from pathname
    const clubKey = pathname.split('/')[1];

    useEffect(() => {
        const updateIndicator = () => {
            let currentRef = homeRef
            if (pathname.includes('/MailGeneration')) currentRef = mailRef
            if (pathname.includes('/Stats')) currentRef = statsRef
            if (pathname.includes('/ClubData')) currentRef = adminRef

            if (currentRef.current) {
                const { offsetLeft, offsetWidth } = currentRef.current
                setIndicatorStyle({
                    left: offsetLeft,
                    width: offsetWidth
                })
            }
        }

        updateIndicator()
        window.addEventListener('resize', updateIndicator)
        return () => window.removeEventListener('resize', updateIndicator)
    }, [pathname])

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            setUser(JSON.parse(userStr))
        }
    }, [])

    const handleLogout = () => {
        // Clear user data from localStorage and cookies
        localStorage.removeItem('user')
        Cookies.remove('token')
        setUser(null)
        router.push('/login')
    }

    // Don't show navbar on login page
    if (pathname === '/login') return null

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link
                            ref={homeRef}
                            href={`/${clubKey}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <HomeIcon className="w-5 h-5" />
                            <span>Hem</span>
                        </Link>
                        <Link
                            ref={mailRef}
                            href={`/${clubKey}/MailGeneration`}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <EnvelopeIcon className="w-5 h-5" />
                            <span>Generera</span>
                        </Link>
                        <Link
                            ref={statsRef}
                            href={`/${clubKey}/Stats`}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChartBarIcon className="w-5 h-5" />
                            <span>Statistik</span>
                        </Link>
                        {user && (
                            <Link
                                ref={adminRef}
                                href={`/${clubKey}/ClubData`}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Cog6ToothIcon className="w-5 h-5" />
                                <span>Admin</span>
                            </Link>
                        )}
                    </div>
                    {user && (
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-700 hover:text-gray-900"
                        >
                            Logga ut
                        </button>
                    )}
                </div>
                <div className="relative h-0.5 bg-gray-200">
                    <div
                        className="absolute h-full bg-blue-600 transition-all duration-300"
                        style={indicatorStyle}
                    />
                </div>
            </div>
        </nav>
    )
}
