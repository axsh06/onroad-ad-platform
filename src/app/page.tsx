import { redirect } from 'next/navigation'

// Keep the existing ONROAD landing page as the public homepage.
export default function HomePage() {
  redirect('/index.html')
}
