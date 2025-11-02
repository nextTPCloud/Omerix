import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { PublicHeader } from '@/components/layout/PublicHeader'

export default function ForgotPasswordPage() {
  return (
    <>
      <PublicHeader />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <ForgotPasswordForm />
      </div>
    </>
  )
}