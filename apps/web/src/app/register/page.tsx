import { RegisterForm } from '@/components/auth/RegisterForm'
import { PublicHeader } from '@/components/layout/PublicHeader'

export default function RegisterPage() {
  return (
    <div className="public-light-theme">
        <PublicHeader />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
           <RegisterForm />
        </div>
    </div>
   
  )
}