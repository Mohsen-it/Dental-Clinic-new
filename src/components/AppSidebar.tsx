import * as React from "react"
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  User2,
  Package,
  BarChart3,
  Microscope,
  Pill,
  Heart,
  Stethoscope,
  ClipboardList,
  Receipt,
  FileText,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { useStableClinicName, useStableDoctorName, useStableClinicLogo } from "@/hooks/useStableSettings"

// Navigation items data
const navigationItems = [
  {
    title: "لوحة التحكم",
    url: "dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "المرضى",
    url: "patients",
    icon: Users,
  },
  {
    title: "المواعيد",
    url: "appointments",
    icon: Calendar,
  },
  {
    title: "المدفوعات",
    url: "payments",
    icon: CreditCard,
  },
  {
    title: "المخزون",
    url: "inventory",
    icon: Package,
  },
  {
    title: "المختبرات",
    url: "labs",
    icon: Microscope,
  },
  {
    title: "الأدوية والوصفات",
    url: "medications",
    icon: Pill,
  },
  {
    title: "العلاجات السنية",
    url: "dental-treatments",
    icon: Heart,
  },
  {
    title: "احتياجات العيادة",
    url: "clinic-needs",
    icon: ClipboardList,
  },
  {
    title: "مصروفات العيادة",
    url: "expenses",
    icon: Receipt,
  },
  {
    title: "التقارير",
    url: "reports",
    icon: BarChart3,
  },
  {
    title: "فاتورة تقديرية ",
    url: "external-estimate",
    icon: FileText,
  },
  {
    title: "الإعدادات",
    url: "settings",
    icon: Settings,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AppSidebar({ activeTab, onTabChange, ...props }: AppSidebarProps) {
  const clinicName = useStableClinicName()
  const doctorName = useStableDoctorName()
  const clinicLogo = useStableClinicLogo()

  return (
    <Sidebar collapsible="offcanvas" side="right" className="border-l border-border/40 rtl-layout" style={{
      boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.04)',
      borderRadius: '0 1rem 1rem 0'
    }} {...props}>
      <SidebarHeader className="border-b border-border/20 bg-gradient-to-l from-background via-accent/5 to-accent/15 px-5 py-6 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-accent/25 transition-all duration-300 ease-out flex-rtl group cursor-pointer">
                <div 
                  className="flex aspect-square size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-sky-550 to-sky-600 text-white overflow-hidden relative"
                  style={{
                    boxShadow: '0 8px 16px -4px rgba(14, 165, 233, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                  }}
                >
                  {clinicLogo && clinicLogo.trim() !== '' ? (
                    <img
                      src={clinicLogo}
                      alt="شعار العيادة"
                      className="w-full h-full object-cover rounded-2xl"
                      onError={(e) => {
                        console.error('Sidebar header logo failed to load:', clinicLogo)
                        // Fallback to default icon
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          const fallbackIcon = document.createElement('div')
                          fallbackIcon.innerHTML = '<svg class="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                          parent.appendChild(fallbackIcon)
                        }
                      }}
                    />
                  ) : (
                    <Stethoscope className="size-8 drop-shadow-sm" strokeWidth={2.5} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </div>
                <div className="grid flex-1 text-right leading-relaxed gap-0.5">
                  <span 
                    className="truncate font-extrabold text-lg tracking-tight text-foreground"
                    style={{ letterSpacing: '0.01em' }}
                  >
                    {clinicName}
                  </span>
                  <span className="truncate text-[11px] font-semibold uppercase tracking-wide opacity-70 text-foreground/80">
                    نظام إدارة العيادة
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        <SidebarGroup className="space-y-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5 nav-rtl">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={activeTab === item.url}
                    onClick={() => onTabChange(item.url)}
                    className="flex items-center gap-3 w-full text-right justify-start rounded-full transition-all duration-200 py-2.5 px-4 text-base nav-item group"
                    style={{
                      backgroundColor: activeTab === item.url ? 'hsl(var(--accent))' : 'transparent',
                      borderRight: activeTab === item.url ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                    }}
                  >
                    <item.icon className="size-5 text-sky-600 dark:text-sky-400 nav-icon transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/20 bg-gradient-to-r from-background via-accent/5 to-accent/15 px-5 py-4 mt-auto backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-accent/25 transition-all duration-300 ease-out cursor-pointer group">
              <div 
                className="flex aspect-square size-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white overflow-hidden relative ring-2 ring-sky-200/20 dark:ring-sky-400/10"
                style={{
                  boxShadow: '0 4px 12px -2px rgba(14, 165, 233, 0.3)',
                }}
              >
                {clinicLogo && clinicLogo.trim() !== '' ? (
                  <img
                    src={clinicLogo}
                    alt="شعار العيادة"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      console.error('Sidebar footer logo failed to load:', clinicLogo)
                      // Fallback to default icon
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        const fallbackIcon = document.createElement('div')
                        fallbackIcon.innerHTML = '<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
                        parent.appendChild(fallbackIcon)
                      }
                    }}
                  />
                ) : (
                  <User2 className="size-5" strokeWidth={2.5} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
              </div>
              <div className="grid flex-1 text-right leading-tight gap-0.5">
                <span className="truncate font-bold text-sm text-foreground">د. {doctorName}</span>
                <span className="truncate text-[11px] font-medium text-foreground/60">
                  {clinicName}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
