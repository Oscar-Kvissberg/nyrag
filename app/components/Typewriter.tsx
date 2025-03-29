'use client'

import { useState, useEffect } from 'react'

interface TypewriterProps {
    text: string
    delay?: number
    restartDelay?: number
}

export default function Typewriter({ text, delay = 50, restartDelay = 2000 }: TypewriterProps) {
    const [currentText, setCurrentText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        let timeout: NodeJS.Timeout

        if (!isDeleting && currentIndex < text.length) {
            // Typing
            timeout = setTimeout(() => {
                setCurrentText(prevText => prevText + text[currentIndex])
                setCurrentIndex(prevIndex => prevIndex + 1)
            }, delay)
        } else if (!isDeleting && currentIndex >= text.length) {
            // Finished typing, wait before deleting
            timeout = setTimeout(() => {
                setIsDeleting(true)
                setCurrentText('')  // Delete all at once
                setCurrentIndex(0)
            }, restartDelay)
        } else if (isDeleting) {
            // Reset to start over immediately
            setIsDeleting(false)
        }

        return () => clearTimeout(timeout)
    }, [currentIndex, delay, isDeleting, text, restartDelay])

    return (
        <span>
            {currentText}
            <span className="animate-[blink_1s_steps(1)_infinite]">|</span>
        </span>
    )
} 