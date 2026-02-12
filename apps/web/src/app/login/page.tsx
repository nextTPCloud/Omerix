import { LoginForm } from '@/components/auth/LoginForm'
import { PublicHeader } from '@/components/layout/PublicHeader'

export default function LoginPage() {
  return (
    <div className="public-light-theme">
        <PublicHeader/>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <LoginForm />
        </div>
    </div>
  )
}