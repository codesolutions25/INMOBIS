"use client"

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import PublicLayout from "../../layouts/PublicLayout"
import Image from "next/image"
import { LoginForm } from "@/components/LoginForm"



export default function LoginPage() {
 

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
			scriptProps={{
				async: true,
				defer: true,
				appendTo: "body",  
				nonce: undefined
			}}
        >
            <PublicLayout>
                <Card className="bg-[var(--foreground)] w-80 md:w-110">
                    <CardHeader className="flex justify-center">
                        <Image 
                            src="/logo.png" 
                            alt="logo" 
                            width={240} 
                            height={96} 
                            priority
                        />
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                    </CardContent>
                </Card>
            </PublicLayout>
        </GoogleReCaptchaProvider>
    )
}