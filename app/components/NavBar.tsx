'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { EnvelopeIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie'

interface User {
  username: string;
  clubId: string;
  role: string;
}

export default function NavBar() {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
    const mailRef = useRef<HTMLAnchorElement>(null)
    const statsRef = useRef<HTMLAnchorElement>(null)
    const adminRef = useRef<HTMLAnchorElement>(null)

    // Extract club from pathname
    const clubKey = pathname.split('/')[1];

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            setUser(JSON.parse(userStr))
        }
    }, [])

    useEffect(() => {
        const updateIndicator = () => {
            let currentRef = mailRef
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
        <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href={`/${clubKey}`} className="text-xl font-bold text-gray-800">
                                {clubKey}
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8 relative">
                            <div 
                                className="absolute h-8 bg-blue-100 border border-blue-800 rounded-md transition-all duration-300 ease-in-out"
                                style={{
                                    left: `${indicatorStyle.left}px`,
                                    width: `${indicatorStyle.width}px`,
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                            <Link
                                ref={mailRef}
                                href={`/${clubKey}/MailGeneration`}
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md relative z-10 ${
                                    pathname === `/${clubKey}/MailGeneration`
                                        ? 'text-blue-800'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <EnvelopeIcon className="w-5 h-5 mr-2" />
                                <span>Generera</span>
                            </Link>
                            <Link
                                ref={statsRef}
                                href={`/${clubKey}/Stats`}
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md relative z-10 ${
                                    pathname === `/${clubKey}/Stats`
                                        ? 'text-blue-800'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <ChartBarIcon className="w-5 h-5 mr-2" />
                                <span>Statistik</span>
                            </Link>
                            {user && (
                                <Link
                                    ref={adminRef}
                                    href={`/${clubKey}/ClubData`}
                                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md relative z-10 ${
                                        pathname === `/${clubKey}/ClubData`
                                            ? 'text-blue-800'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Cog6ToothIcon className="w-5 h-5 mr-2" />
                                    <span>Admin</span>
                                </Link>
                            )}
                        </div>
                    </div>
                    {user && (
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-700 hover:text-gray-900"
                            >
                                Logga ut
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
