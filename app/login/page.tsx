import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground">EduHub</h1>
          <p className="mt-2 text-muted-foreground">Create and share educational programs</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
