"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

type SectionProps = {
  children: React.ReactNode;
  className?: string;
}

function AdminCardLayoutRoot({ children, className }: SectionProps) {
  return <Card className={className}>{children}</Card>
}

function AdminCardHeader({ children }: SectionProps) {
  return (
    <CardHeader className="flex flex-col gap-2">
      {children}
    </CardHeader>
  )
}

function AdminCardTitle({ children }: SectionProps) {
  return <CardTitle>{children}</CardTitle>
}

function AdminCardContent({ children, className }: SectionProps) {
  return <CardContent className={className}>{children}</CardContent>
}

// Exportando con composición
export const AdminCardLayout = Object.assign(AdminCardLayoutRoot, {
  Header: AdminCardHeader,
  Content: AdminCardContent,
  Title: AdminCardTitle,
})
