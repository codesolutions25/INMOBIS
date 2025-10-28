'use client';

export default function PublicLayout(
    { children } : { children: React.ReactNode }
    ){
    return(
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(/background.png)` }}
            >                    
            </div>
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative z-40">
                {children}  
            </div>
        </div>
    )
}