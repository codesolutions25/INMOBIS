"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FaUser } from "react-icons/fa"
import { GiPadlock } from "react-icons/gi"
import { Loader2, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/Label"

export function LoginForm() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { executeRecaptcha } = useGoogleReCaptcha()
    const { login, isAuthenticated } = useAuth()

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/seleccionEmpresa')
        }
    }, [isAuthenticated, router])

    // Handle reCAPTCHA token generation
    const handleReCaptchaVerify = useCallback(async () => {
        if (!executeRecaptcha) {
            console.warn('reCAPTCHA not available yet')
            return null;
        }

        try {
            const token = await executeRecaptcha('login')
            return token;
        } catch (error) {
            console.error('reCAPTCHA error:', error)
            return null;
        }
    }, [executeRecaptcha])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!username.trim() || !password.trim()) {
            setError("Por favor ingrese un usuario y contraseña")
            return
        }

        setError("")
        setLoading(true)

        try {
            const token = await handleReCaptchaVerify()
            
            if (!token) {
                throw new Error("No se pudo cargar reCAPTCHA. Por favor, recarga la página.")
            }

            await login({ 
                username: username.trim(),
                password: password.trim(),
                captcha: token
            })
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Error al iniciar sesión. Por favor, inténtalo de nuevo."
            
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="email" className="flex gap-1 text-white">
                    <FaUser /> Usuario
                </Label>
                <Input
                    id="email"
                    type="text"
                    placeholder="Nombre de usuario"
                    className="bg-white"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <Label htmlFor="password" className="flex gap-1 text-white">
                    <GiPadlock /> Contraseña
                </Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña"
                    className="bg-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={loading}
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
            </div>
        </form>
    )
}
