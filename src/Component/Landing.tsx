import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaGithub } from "react-icons/fa"

const Landing = () => {
  return (
    <div className="min-h-screen flex  bg-black text-white">
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
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="absolute top-8 right-8 text-sm font-medium">
          <a href="#" className="hover:bg-gray-400 px-3 py-2 duration-300 hover:text-black rounded-md">Login</a>
        </div>
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Enter your email below to create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <Input type="email" placeholder="name@example.com" required className="bg-[#18181B] text-white border border-border focus:border-white" />
              <Button className="w-full bg-white text-black font-semibold hover:bg-gray-200" type="submit">Sign In with Email</Button>
            </form>
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-border" />
              <span className="mx-2 text-xs text-muted-foreground tracking-widest">OR CONTINUE WITH</span>
              <div className="flex-grow border-t border-border" />
            </div>
            <Button className="w-full border border-border text-white flex items-center justify-center hover:bg-[#232326]" variant="outline" type="button">
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