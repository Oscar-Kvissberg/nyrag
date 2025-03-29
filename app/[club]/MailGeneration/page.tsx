import React from 'react'
import OpenAIBot from '../../components/OpenAIBot'

type Props = {
  params: Promise<{ club: string }>
}

export default async function MailGenerationPage({ params }: Props) {
  await params
  
  return (
    <div className="container mx-auto px-4 py-8">
      <OpenAIBot />
    </div>
  )
}
