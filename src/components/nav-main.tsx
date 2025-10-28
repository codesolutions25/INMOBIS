"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: React.ElementType
  isActive?: boolean
  items?: NavItem[]
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Tree item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function Tree({ item }: { item: NavItem }) {
  const Icon = item.icon

  if (!item.items || item.items.length === 0) {
    return (
      <SidebarMenuButton
        asChild
        isActive={item.isActive}
        className="data-[active=true]:bg-muted"
      >
        <Link href={item.url} className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {item.title}
        </Link>
      </SidebarMenuButton>
    )
  }
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:third-child]:rotate-90"
        defaultOpen={item.isActive}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} className="cursor-pointer">
            {Icon && <Icon className="h-4 w-4" />}
            {item.title}
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"  />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem, index) => (
              <Tree key={index} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}