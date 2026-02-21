"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_USERS, ROLE_LABELS, APP_NAME } from "@/lib/constants";
import {
  CreditCard,
  Shield,
  BarChart3,
  Receipt,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      } else if (result?.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Login failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const quickLogin = async (user: (typeof DEMO_USERS)[0]) => {
    setEmail(user.email);
    setPassword(user.password);
    await doLogin(user.email, user.password);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#9C1D26] via-[#7A161E] to-[#5A1015] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">{APP_NAME}</span>
          </div>
          <p className="text-white/70 text-sm">Enterprise Corporate Card & Expense Management</p>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage Corporate Cards.
            <br />
            <span className="text-cyan-300">Simplify Expenses.</span>
            <br />
            Stay Compliant.
          </h1>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: CreditCard, label: "Card Management", desc: "Physical & virtual cards" },
              { icon: Receipt, label: "Smart Expenses", desc: "OCR receipt capture" },
              { icon: Shield, label: "Policy Engine", desc: "Configurable rules" },
              { icon: BarChart3, label: "Analytics", desc: "Real-time insights" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10"
              >
                <feature.icon className="w-5 h-5 text-cyan-300 mb-2" />
                <p className="text-white font-medium text-sm">{feature.label}</p>
                <p className="text-white/60 text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Building2 className="w-4 h-4" />
            <span>India-first: GST, TDS, UPI, NEFT/RTGS/IMPS built-in</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1">
              Sign in to your corporate card portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Quick Demo Login
              </CardTitle>
              <CardDescription className="text-xs">
                Click any role to auto-fill credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  onClick={() => quickLogin(user)}
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-sm rounded-md hover:bg-accent transition-colors"
                >
                  <div>
                    <span className="font-medium">{user.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{user.email}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
