import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { PublicHeader } from '@/components/layout/PublicHeader'

export default function ResetPasswordPage() {
  return (
    <>
      <PublicHeader />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <ResetPasswordForm />
      </div>
    </>
  )
}