import React from 'react'
import Stats from '../../components/Stats'

type Props = {
  params: Promise<{ club: string }>
}

export default async function StatsPage({ params }: Props) {
  await params
  
  return (
    <div className="container mx-auto px-4 py-24">
      <Stats />
    </div>
  )
}
