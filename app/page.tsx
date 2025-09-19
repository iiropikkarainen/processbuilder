export const dynamic = "force-dynamic"

import OpsCatalog from "@/components/ops-catalog"
import { AppShell } from "@/components/app-shell"

export default function Home() {
  return (
    <AppShell>
      <OpsCatalog />
    </AppShell>
  )
}
