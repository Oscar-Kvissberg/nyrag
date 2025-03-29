import React from 'react'
import { clubs } from '../config/clubs'
import Typewriter from '../components/Typewriter'

type Props = {
  params: Promise<{ club: string }>
}

export default async function ClubPage({ params }: Props) {
  const { club } = await params
  const clubConfig = clubs[club] || clubs.vasatorp
  const clubEmail = club.toLowerCase()
  
  return (
    <div className="relative overflow-hidden min-h-screen -mt-8 -mb-8">
      {/* Gradient blobs/shadows */}
      <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute top-[30%] right-[-20%] w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-purple-500/20 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{clubConfig.displayName}</span> E-post Assistent
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mb-12">
            Öka din produktivitet med vår e-postassistent. 
            Generera professionella och tydliga svar snabbt och enkelt.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <a 
              href={`/${club}/MailGeneration`} 
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Kom igång
            </a>
            <a 
              href={`/${club}/Stats`} 
              className="px-8 py-4 bg-white text-gray-800 rounded-lg font-semibold border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Se statistik
            </a>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg max-w-3xl w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-sm text-gray-500">name@{clubEmail}.catalinasoftwaresolutions.se</div>
            </div>
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 text-left">
              <p className="text-gray-700 font-mono h-6">
                <Typewriter 
                  text="Låt Assistenten hjälpa dig att skriva professionella e-postsvar på några sekunder..." 
                  delay={40}
                  restartDelay={2000}
                />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 