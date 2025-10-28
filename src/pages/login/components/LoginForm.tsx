"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FaUser } from "react-icons/fa"
import { GiPadlock } from "react-icons/gi"
import { Label } from "@/components/ui/Label"

export default function LoginForm() {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!username.trim() || !password.trim()) {
            setError("Por favor ingrese un usuario y contraseña")
            return
        }

        setError("")
        setLoading(true)

        try {
            if (!executeRecaptcha) {
                throw new Error("reCAPTCHA no está listo")
            }

            const token = await executeRecaptcha('login')
            
            await login({ 
                username, 
                password,
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
                <div className="text-red-500 text-sm text-center">
                    {error}
                </div>
            )}

            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
            </div>
        </form>
    )
}