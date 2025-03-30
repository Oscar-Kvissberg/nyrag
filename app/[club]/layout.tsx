import NavBar from '../components/NavBar'

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <NavBar />
      {children}
    </>
  )
} 