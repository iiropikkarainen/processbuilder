import OpsCatalog from "@/components/ops-catalog"
import { DashboardShell } from "@/components/dashboard-shell"

export default function Home() {
  return (
    <DashboardShell>
      <OpsCatalog />
    </DashboardShell>
  )
}
