import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaGithub } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"

const Landing = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      navigate("/dashboard")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setError("")
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
      })

      if (error) throw error
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-black text-white">
      {/* Left Side */}
      <div className="md:w-1/2 flex bg-[#18181B] flex-col justify-between p-8">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold mb-8">
            <span className="text-2xl">⌘</span>
            Acme Inc
          </div>
        </div>
        <div className="mb-2 mt-auto">
          <blockquote className="text-lg font-medium mb-2">
            "This library has saved me countless hours of work and helped me deliver stunning designs to my clients faster than ever before."
          </blockquote>
          <div className="text-sm">Sofia Davis</div>
        </div>
      </div>
      {/* Right Side */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-black relative">
        <div className="absolute top-8 right-8 text-sm font-medium">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="hover:bg-gray-400 px-3 py-2 duration-300 hover:text-black rounded-md"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Enter your credentials to sign in" 
                : "Enter your email below to create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-md text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#18181B] text-white border border-border focus:border-white"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#18181B] text-white border border-border focus:border-white"
              />
              <Button
                type="submit"
                className="w-full bg-white text-black font-semibold hover:bg-gray-200"
                disabled={loading}
              >
                {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
              </Button>
            </form>
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-border" />
              <span className="mx-2 text-xs text-muted-foreground tracking-widest">OR CONTINUE WITH</span>
              <div className="flex-grow border-t border-border" />
            </div>
            <Button
              className="w-full border border-border bg-black text-white flex items-center justify-center hover:bg-gray-900 hover:text-white"
              variant="outline"
              type="button"
              onClick={handleGitHubSignIn}
              disabled={loading}
            >
              <FaGithub className="mr-2" />
              GitHub
            </Button>
            <p className="mt-6 text-md px-5 text-muted-foreground text-center">
              By clicking continue, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Landing