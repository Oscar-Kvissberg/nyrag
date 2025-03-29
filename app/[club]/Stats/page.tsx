import React from 'react'
import Stats from '../../components/Stats'
import { clubs } from '../../config/clubs'

type Props = {
  params: Promise<{ club: string }>
}

export default async function StatsPage({ params }: Props) {
  const { club } = await params
  const clubConfig = clubs[club] || clubs.vasatorp
  
  return (
    <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Statistik för {clubConfig.displayName} (in progress...)</h1>
      <Stats />
    </div>
  )
}
