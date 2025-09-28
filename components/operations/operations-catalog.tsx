"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  FileText,
  ListChecks,
  Maximize2,
  MoreHorizontal,
  Minimize2,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

import { cn } from "@/lib/utils"
import { deadlinesAreEqual } from "@/lib/workflow-utils"
import type { OutputSubmission, ProcessDeadline, Task, Workflow } from "@/lib/types"
import type { Database } from "@/types/supabase"

import CalendarView from "./calendar-view"
import ProcessView from "./process-view"
import ProcessSettingsView from "./process-settings-view"
import {
  CURRENT_PROCESSOR_NAME,
  OWNER_OPTIONS,
  PROCESS_CREATOR_NAME,
  SOP_IMPORT_OPTIONS,
  SOP_STATUS_BADGE_STYLES,
  SOP_STATUS_LABELS,
  TIMEZONE_OPTIONS,
} from "./data"
import type {
  Category,
  OpsCatalogProps,
  OutputSubmissionPayload,
  ProcessSettings,
  Sop,
  SopStatus,
} from "./types"
import { buildSopContent, filterData, slugify } from "./utils"
import { ProcessEditor, extractPlainText } from "../process-editor"

export default function OpsCatalog({ query }: OpsCatalogProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedSOP, setSelectedSOP] = useState<Sop | null>(null)
  const [data, setData] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<"editor" | "process" | "calendar" | "settings">(
    "editor",
  )
  const [tasks, setTasks] = useState<Task[]>([])
  const [processSettings, setProcessSettings] = useState<ProcessSettings | null>(null)
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)
  const [outputSubmissions, setOutputSubmissions] = useState<
    Record<string, OutputSubmission | undefined>
  >({})

  const supabase = useSupabaseClient<Database>()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateUrlForSelectedSop = useCallback(
    (sop: Sop | null) => {
      const currentProcessId = searchParams.get("processId")
      const nextProcessId = sop?.id ?? null

      if (currentProcessId === nextProcessId || (!currentProcessId && !nextProcessId)) {
        return
      }

      const params = new URLSearchParams(searchParams)
      if (nextProcessId) {
        params.set("processId", nextProcessId)
      } else {
        params.delete("processId")
      }

      const queryString = params.toString()
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname
      router.replace(nextUrl, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const handleSelectSop = useCallback(
    (sop: Sop) => {
      setSelectedSOP(sop)
      setViewMode("editor")
      updateUrlForSelectedSop(sop)
    },
    [updateUrlForSelectedSop],
  )

  const clearSelectedSop = useCallback(() => {
    setSelectedSOP(null)
    setViewMode("editor")
    updateUrlForSelectedSop(null)
  }, [updateUrlForSelectedSop])

  const findSopById = useCallback(
    (id: string) => {
      for (const category of data) {
        const sop = category.sops.find((item) => item.id === id)
        if (sop) {
          return { sop, categoryId: category.id }
        }
      }
      return null
    },
    [data],
  )

  const processIdFromParams = searchParams.get("processId")

  useEffect(() => {
    let isActive = true

    const loadOperationsData = async () => {
      setIsLoading(true)
      setFetchError(null)

      let categoryRows: { id: string; title: string }[] | null = null
      let processRows:
        | {
            id: string
            name: string
            description: string | null
            status: string | null
            content?: string | null
            category_id?: string | null
            created_at: string | null
            updated_at: string | null
          }[]
        | null = null

      try {
        const [categoryResult, processResult] = await Promise.all([
          supabase.from("operations_categories").select("id, title").order("title", { ascending: true }),
          supabase
            .from("processes")
            .select("id, name, description, status, content, category_id, created_at, updated_at")
            .order("name", { ascending: true }),
        ])

        if (!isActive) {
          return
        }

        categoryRows = categoryResult.data
        processRows = processResult.data

        if (categoryResult.error || processResult.error) {
          console.error("Failed to load operations data", categoryResult.error ?? processResult.error)
          setFetchError(
            categoryResult.error?.message ??
              processResult.error?.message ??
              "Unable to load operations data",
          )
        }
      } catch (error) {
        if (!isActive) {
          return
        }

        console.error("Unexpected error while loading operations data", error)
        setFetchError(error instanceof Error ? error.message : "Unable to load operations data")
      }

      if (!isActive) {
        return
      }

      const categoriesMap = new Map<string, Category>()

      const ensureCategory = (
        id: string | null | undefined,
        title?: string | null,
        supabaseId?: string | null,
      ): Category => {
        const trimmedId = id?.trim()
        const resolvedTitle = title?.trim() || trimmedId || "Uncategorized"
        const normalizedId = trimmedId || slugify(resolvedTitle) || `category-${Date.now()}`

        const existing = categoriesMap.get(normalizedId)
        if (existing) {
          return existing
        }

        const category: Category = {
          id: normalizedId,
          title: resolvedTitle,
          subcategories: [],
          sops: [],
          supabaseId: supabaseId ?? trimmedId ?? undefined,
        }

        categoriesMap.set(normalizedId, category)
        return category
      }

      categoryRows?.forEach((row) => {
        ensureCategory(row.id, row.title, row.id)
      })

      const fallbackCategoryId = categoriesMap.size > 0 ? [...categoriesMap.keys()][0] : null

      const normalizeStatus = (status?: string | null): SopStatus => {
        const normalized = status?.toLowerCase().trim()
        if (normalized === "active") return "active"
        if (normalized === "inactive") return "inactive"
        return "in-design"
      }

      const formatUpdatedDate = (value?: string | null) => {
        if (!value) {
          return new Date().toISOString().slice(0, 10)
        }

        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) {
          return new Date().toISOString().slice(0, 10)
        }

        return parsed.toISOString().slice(0, 10)
      }

      const processes = processRows ?? []
      processes.forEach((process) => {
        const processWithCategory = process as typeof process & { category_id?: string | null }
        const categoryId = processWithCategory.category_id ?? fallbackCategoryId
        const category = ensureCategory(categoryId, undefined, categoryId ?? undefined)
        const subcategoryId = category.subcategories[0]?.id ?? `${category.id}-general`

        if (category.subcategories.length === 0) {
          category.subcategories.push({ id: subcategoryId, title: "General" })
        }

        category.sops.push({
          id: process.id,
          title: process.name || "Untitled process",
          subcategoryId,
          owner: PROCESS_CREATOR_NAME,
          lastUpdated: formatUpdatedDate(process.updated_at ?? process.created_at ?? undefined),
          status: normalizeStatus(process.status),
          content: (process as typeof process & { content?: string | null }).content ?? process.description ?? "",
          processSettings: {
            owner: PROCESS_CREATOR_NAME,
            processType: "one-time",
            oneTimeDeadline: null,
            recurrence: {
              frequency: "monthly",
              customDays: [],
              time: "09:00",
              timezone: TIMEZONE_OPTIONS[0] ?? "UTC",
            },
            vaultAccess: [],
          },
        })
      })

      let nextCategories = Array.from(categoriesMap.values()).map((category) => {
        if (category.subcategories.length === 0) {
          const defaultSubcategoryId = `${category.id}-general`
          return {
            ...category,
            subcategories: [{ id: defaultSubcategoryId, title: "General" }],
            sops: category.sops.map((sop) => ({
              ...sop,
              subcategoryId: sop.subcategoryId || defaultSubcategoryId,
            })),
          }
        }

        return {
          ...category,
          sops: category.sops.map((sop) => ({
            ...sop,
            subcategoryId: sop.subcategoryId || category.subcategories[0]?.id || `${category.id}-general`,
          })),
        }
      })

      if (!nextCategories.length && processes.length > 0) {
        const fallbackCategory = ensureCategory("all-processes", "Processes", "all-processes")
        fallbackCategory.subcategories = [{ id: `${fallbackCategory.id}-general`, title: "General" }]
        processes.forEach((process) => {
          fallbackCategory.sops.push({
            id: process.id,
            title: process.name || "Untitled process",
            subcategoryId: fallbackCategory.subcategories[0]?.id ?? `${fallbackCategory.id}-general`,
            owner: PROCESS_CREATOR_NAME,
            lastUpdated: formatUpdatedDate(process.updated_at ?? process.created_at ?? undefined),
            status: normalizeStatus(process.status),
            content: (process as typeof process & { content?: string | null }).content ?? process.description ?? "",
            processSettings: {
              owner: PROCESS_CREATOR_NAME,
              processType: "one-time",
              oneTimeDeadline: null,
              recurrence: {
                frequency: "monthly",
                customDays: [],
                time: "09:00",
                timezone: TIMEZONE_OPTIONS[0] ?? "UTC",
              },
              vaultAccess: [],
            },
          })
        })

        nextCategories = Array.from(categoriesMap.values())
      }

      if (!isActive) {
        return
      }

      setData(nextCategories)
      setExpanded((prev) => {
        const next: Record<string, boolean> = {}
        nextCategories.forEach((category, index) => {
          next[category.id] = prev[category.id] ?? index === 0
        })
        return next
      })

      setIsLoading(false)
    }

    void loadOperationsData()

    return () => {
      isActive = false
    }
  }, [supabase, setExpanded])

  useEffect(() => {
    if (!processIdFromParams) {
      if (selectedSOP) {
        clearSelectedSop()
      }
      return
    }

    if (selectedSOP?.id === processIdFromParams) {
      return
    }

    const match = findSopById(processIdFromParams)
    if (match) {
      handleSelectSop(match.sop)
      setExpanded((prev) => {
        if (prev[match.categoryId]) {
          return prev
        }
        return { ...prev, [match.categoryId]: true }
      })
      return
    }

    if (selectedSOP) {
      clearSelectedSop()
    }
  }, [
    processIdFromParams,
    selectedSOP,
    clearSelectedSop,
    findSopById,
    handleSelectSop,
  ])

  const handleWorkflowUpdate = useCallback((workflow: Workflow) => {
    setCurrentWorkflow(workflow)
  }, [])

  const handleOutputSubmission = useCallback(
    (nodeId: string, payload: OutputSubmissionPayload) => {
      const timestamp = new Date().toISOString()

      setOutputSubmissions((prev) => ({
        ...prev,
        [nodeId]: {
          nodeId,
          type: payload.type,
          value: payload.value,
          fileName: payload.fileName,
          completedBy: CURRENT_PROCESSOR_NAME,
          completedAt: timestamp,
        },
      }))
    },
    [],
  )

  const [newCategoryTitle, setNewCategoryTitle] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryTitle, setEditingCategoryTitle] = useState("")
  const [newSopInputs, setNewSopInputs] = useState<
    Record<string, { title: string; owner: string; content: string }>
  >({})
  const [showAddSop, setShowAddSop] = useState<Record<string, boolean>>({})
  const [aiPromptCategory, setAiPromptCategory] = useState<string | null>(null)
  const [aiPromptDraft, setAiPromptDraft] = useState("")
  const [processViewerPromptTitle, setProcessViewerPromptTitle] = useState("")
  const [processViewerPrompt, setProcessViewerPrompt] = useState("")
  const [pendingProcessViewerPrompt, setPendingProcessViewerPrompt] = useState<
    { title: string; prompt: string } | null
  >(null)
  const [showCategorySelection, setShowCategorySelection] = useState(false)
  const [selectedCategoryForViewerPrompt, setSelectedCategoryForViewerPrompt] = useState("")
  const [editingSop, setEditingSop] = useState<
    { id: string; categoryId: string; title: string; owner: string } | null
  >(null)


  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = !prev[id]

      if (!next) {
        setShowAddSop((prevVisible) => ({ ...prevVisible, [id]: false }))
        if (aiPromptCategory === id) {
          setAiPromptCategory(null)
          setAiPromptDraft("")
        }
      }

      return { ...prev, [id]: next }
    })

  const handleToggleAddSop = (categoryId: string) => {
    setShowAddSop((prev) => {
      const next = !prev[categoryId]

      if (next) {
        setExpanded((prevExpanded) => ({ ...prevExpanded, [categoryId]: true }))
      } else if (aiPromptCategory === categoryId) {
        setAiPromptCategory(null)
        setAiPromptDraft("")
      }

      return { ...prev, [categoryId]: next }
    })
  }

  const updateSOP = (id: string, newContent: string) => {
    const today = new Date().toISOString().split("T")[0]

    setData((prev) =>
      prev.map((category) => ({
        ...category,
        sops: category.sops.map((sop) =>
          sop.id === id ? { ...sop, content: newContent, lastUpdated: today } : sop,
        ),
      })),
    )

    if (selectedSOP?.id === id) {
      setSelectedSOP((prev) =>
        prev ? { ...prev, content: newContent, lastUpdated: today } : prev,
      )
    }
  }

  const handleAddCategory = async () => {
    const trimmed = newCategoryTitle.trim()
    if (!trimmed) return

    const baseId = slugify(trimmed) || `category-${Date.now()}`
    const uniqueId = data.some((category) => category.id === baseId)
      ? `${baseId}-${Date.now()}`
      : baseId
    const defaultSubcategoryId = `${uniqueId}-general`

    const { data: insertedCategory, error: insertCategoryError } = await supabase
      .from("operations_categories")
      .insert({ title: trimmed })
      .select("id")
      .single()

    if (insertCategoryError) {
      console.error("Failed to persist category", insertCategoryError)
      return
    }

    const nextCategory: Category = {
      id: uniqueId,
      title: trimmed,
      subcategories: [{ id: defaultSubcategoryId, title: "General" }],
      sops: [],
      supabaseId: insertedCategory?.id,
    }

    const { error: upsertCategoryError } = await supabase
      .from("operations_categories")
      .upsert({ id: uniqueId, title: trimmed })

    if (upsertCategoryError) {
      console.error("Failed to persist category", upsertCategoryError)
      return
    }

    setData((prev) => [...prev, nextCategory])
    setExpanded((prev) => ({ ...prev, [uniqueId]: true }))
    setNewCategoryTitle("")
  }

  const handleToggleAddCategory = () => {
    setShowAddCategory((prev) => {
      if (prev) {
        setNewCategoryTitle("")
      }

      return !prev
    })
  }

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditingCategoryTitle(category.title)
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditingCategoryTitle("")
  }

  const saveCategoryTitle = () => {
    if (!editingCategoryId) return
    const trimmed = editingCategoryTitle.trim()
    if (!trimmed) return

    setData((prev) =>
      prev.map((category) =>
        category.id === editingCategoryId ? { ...category, title: trimmed } : category,
      ),
    )

    setEditingCategoryId(null)
    setEditingCategoryTitle("")
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = data.find((item) => item.id === categoryId)
    if (!category) return

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Delete category "${category.title}" and all associated Processes?`,
      )
      if (!confirmed) return
    }

    const containsSelected = selectedSOP
      ? category.sops.some((sop) => sop.id === selectedSOP.id)
      : false

    if (category.supabaseId) {
      const { error } = await supabase
        .from("operations_categories")
        .delete()
        .eq("id", category.supabaseId)

      if (error) {
        console.error("Failed to remove category", error)
        return
      }

 main
    }

    setData((prev) => prev.filter((item) => item.id !== categoryId))
    setExpanded((prev) => {
      const next = { ...prev }
      delete next[categoryId]
      return next
    })

    setNewSopInputs((prev) => {
      const next = { ...prev }
      delete next[categoryId]
      return next
    })

    if (editingCategoryId === categoryId) {
      cancelEditCategory()
    }

    if (editingSop?.categoryId === categoryId) {
      setEditingSop(null)
    }

    if (containsSelected) {
      clearSelectedSop()
    }
  }

  const handleNewSopInputChange = (
    categoryId: string,
    field: "title" | "owner" | "content",
    value: string,
  ) => {
    setNewSopInputs((prev) => {
      const existing = prev[categoryId] ?? {
        title: "",
        owner: PROCESS_CREATOR_NAME,
        content: "",
      }

      return {
        ...prev,
        [categoryId]: {
          ...existing,
          [field]: value,
        },
      }
    })
  }

  const handleAddSop = (categoryId: string) => {
    const category = data.find((item) => item.id === categoryId)
    if (!category) return

    const form = newSopInputs[categoryId] ?? {
      title: "",
      owner: PROCESS_CREATOR_NAME,
      content: "",
    }

    const trimmedTitle = form.title.trim()
    if (!trimmedTitle) return

    const owner = form.owner.trim() || PROCESS_CREATOR_NAME
    const prompt = form.content.trim()
    const content = buildSopContent(trimmedTitle, prompt)

    const today = new Date().toISOString().split("T")[0]
    const baseId = slugify(trimmedTitle) || "sop"
    const sopId = `${baseId}-${Date.now()}`
    const firstSubcategoryId = category.subcategories[0]?.id ?? `${categoryId}-general`

    const newSop: Sop = {
      id: sopId,
      title: trimmedTitle,
      subcategoryId: firstSubcategoryId,
      owner,
      lastUpdated: today,
      status: "in-design",
      content,
      processSettings: {
        owner,
        processType: "one-time",
        oneTimeDeadline: null,
        recurrence: {
          frequency: "monthly",
          customDays: [],
          time: "09:00",
          timezone: TIMEZONE_OPTIONS[0] ?? "UTC",
        },
        vaultAccess: [],
      },
    }

    setData((prev) =>
      prev.map((item) => {
        if (item.id !== categoryId) return item

        const hasSubcategories = item.subcategories.length > 0
        return {
          ...item,
          subcategories: hasSubcategories
            ? item.subcategories
            : [{ id: firstSubcategoryId, title: "General" }],
          sops: [...item.sops, newSop],
        }
      }),
    )

    setNewSopInputs((prev) => ({
      ...prev,
      [categoryId]: { title: "", owner: PROCESS_CREATOR_NAME, content: "" },
    }))
  }

  const handleSubmitProcessViewerPrompt = () => {
    const trimmedTitle = processViewerPromptTitle.trim()
    const trimmedPrompt = processViewerPrompt.trim()

    if (!trimmedTitle || !trimmedPrompt || data.length === 0) {
      return
    }

    setPendingProcessViewerPrompt({ title: trimmedTitle, prompt: trimmedPrompt })
    setSelectedCategoryForViewerPrompt((prev) => {
      if (prev && data.some((category) => category.id === prev)) {
        return prev
      }
      return data[0]?.id ?? ""
    })
    setShowCategorySelection(true)
  }

  const handleConfirmProcessViewerPrompt = () => {
    if (!pendingProcessViewerPrompt) {
      return
    }

    const fallbackCategoryId = data[0]?.id ?? ""
    const resolvedCategoryId = data.some((category) => category.id === selectedCategoryForViewerPrompt)
      ? selectedCategoryForViewerPrompt
      : fallbackCategoryId

    if (!resolvedCategoryId) {
      return
    }

    const category = data.find((item) => item.id === resolvedCategoryId)
    if (!category) {
      return
    }

    const timestamp = Date.now()
    const baseId = slugify(pendingProcessViewerPrompt.title) || "sop"
    const sopId = `${baseId}-${timestamp}`
    const firstSubcategoryId = category.subcategories[0]?.id ?? `${resolvedCategoryId}-general`
    const owner = PROCESS_CREATOR_NAME
    const today = new Date().toISOString().split("T")[0]
    const content = buildSopContent(
      pendingProcessViewerPrompt.title,
      pendingProcessViewerPrompt.prompt,
    )

    const newSop: Sop = {
      id: sopId,
      title: pendingProcessViewerPrompt.title,
      subcategoryId: firstSubcategoryId,
      owner,
      lastUpdated: today,
      status: "in-design",
      content,
      processSettings: {
        owner,
        processType: "one-time",
        oneTimeDeadline: null,
        recurrence: {
          frequency: "monthly",
          customDays: [],
          time: "09:00",
          timezone: TIMEZONE_OPTIONS[0] ?? "UTC",
        },
        vaultAccess: [],
      },
    }

    setData((prev) =>
      prev.map((item) => {
        if (item.id !== resolvedCategoryId) return item

        const hasSubcategories = item.subcategories.length > 0

        return {
          ...item,
          subcategories: hasSubcategories
            ? item.subcategories
            : [{ id: firstSubcategoryId, title: "General" }],
          sops: [...item.sops, newSop],
        }
      }),
    )

    setExpanded((prev) => ({ ...prev, [resolvedCategoryId]: true }))
    setShowCategorySelection(false)
    setPendingProcessViewerPrompt(null)
    setProcessViewerPromptTitle("")
    setProcessViewerPrompt("")
    setSelectedCategoryForViewerPrompt(resolvedCategoryId)
    handleSelectSop(newSop)
  }

  const handleDeleteSop = (categoryId: string, sopId: string) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Delete this Process?")
      if (!confirmed) return
    }

    setData((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? { ...category, sops: category.sops.filter((sop) => sop.id !== sopId) }
          : category,
      ),
    )

    if (selectedSOP?.id === sopId) {
      clearSelectedSop()
    }

    if (editingSop?.id === sopId) {
      setEditingSop(null)
    }
  }

  const startEditSop = (categoryId: string, sop: Sop) => {
    setEditingSop({
      id: sop.id,
      categoryId,
      title: sop.title,
      owner: sop.owner,
    })
  }

  const cancelEditSop = () => {
    setEditingSop(null)
  }

  const saveSopEdit = () => {
    if (!editingSop) return

    const trimmedTitle = editingSop.title.trim()
    if (!trimmedTitle) return

    const owner = editingSop.owner.trim() || OWNER_OPTIONS[0] || "Process Owner"
    const today = new Date().toISOString().split("T")[0]

    setData((prev) =>
      prev.map((category) => {
        if (category.id !== editingSop.categoryId) return category

        return {
          ...category,
          sops: category.sops.map((sop) =>
            sop.id === editingSop.id
              ? {
                  ...sop,
                  title: trimmedTitle,
                  owner,
                  lastUpdated: today,
                  processSettings: { ...sop.processSettings, owner },
                }
              : sop,
          ),
        }
      }),
    )

    if (selectedSOP?.id === editingSop.id) {
      setSelectedSOP((prev) =>
        prev
          ? {
              ...prev,
              title: trimmedTitle,
              owner,
              lastUpdated: today,
              processSettings: { ...prev.processSettings, owner },
            }
          : prev,
      )
    }

    setEditingSop(null)
  }

  const handleProcessSettingsChange = useCallback(
    (settings: ProcessSettings) => {
      if (!selectedSOP) return

      setProcessSettings(settings)

      setData((prev) =>
        prev.map((category) => ({
          ...category,
          sops: category.sops.map((sop) =>
            sop.id === selectedSOP.id
              ? { ...sop, owner: settings.owner, processSettings: settings }
              : sop,
          ),
        })),
      )

      setSelectedSOP((prev) =>
        prev ? { ...prev, owner: settings.owner, processSettings: settings } : prev,
      )
    },
    [selectedSOP],
  )

  const handleOneTimeDeadlineUpdate = useCallback(
    (deadline: ProcessDeadline | null) => {
      if (!processSettings || !selectedSOP) {
        return
      }

      const current = processSettings.oneTimeDeadline ?? null
      if (deadlinesAreEqual(current, deadline)) {
        return
      }

      const nextSettings = { ...processSettings, oneTimeDeadline: deadline }
      handleProcessSettingsChange(nextSettings)
    },
    [processSettings, selectedSOP, handleProcessSettingsChange],
  )

  useEffect(() => {
    setOutputSubmissions({})

    if (!selectedSOP) {
      setTasks([])
      setProcessSettings(null)
      setCurrentWorkflow(null)
      return
    }

    const steps = extractPlainText(selectedSOP.content)
      .split(/\n+/)
      .filter((line) => line.trim().match(/^\d+\./))
      .map((line, index) => ({
        id: index + 1,
        text: line.replace(/^\d+\.\s*/, ""),
        due: "",
        completed: false,
        completedBy: "",
        completedAt: null,
        nodeId: null,
      }))

    setTasks(steps)
    setProcessSettings(selectedSOP.processSettings)
    setCurrentWorkflow(null)
  }, [selectedSOP])

  const filteredData = filterData(data, query)
  const processViewerPromptDisabled =
    !processViewerPromptTitle.trim() || !processViewerPrompt.trim() || data.length === 0
  const pendingProcessViewerTitle =
    pendingProcessViewerPrompt?.title ?? processViewerPromptTitle.trim()

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={cn(
          "mx-auto grid max-w-6xl gap-6 px-4 py-6",
          fullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2",
        )}
      >
        {!fullscreen && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Add category</h3>
                  <p className="text-xs text-gray-500">
                    Group related processes by department or team.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAddCategory}
                  aria-label="Toggle Add Category"
                  aria-pressed={showAddCategory}
                  className={cn(
                    "rounded-full p-2 text-gray-500 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                    showAddCategory && "bg-blue-50 text-blue-600 hover:bg-blue-100",
                  )}
                >
                  <Plus
                    className={cn("h-4 w-4 transition", showAddCategory && "rotate-45")}
                  />
                </button>
              </div>
              {showAddCategory && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={newCategoryTitle}
                    onChange={(event) => setNewCategoryTitle(event.target.value)}
                    placeholder="e.g. Facilities Management"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryTitle.trim()}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="rounded-2xl border bg-white p-4 text-sm text-gray-500">
                Loading operations…
              </div>
            ) : fetchError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {fetchError}
              </div>
            ) : filteredData.length === 0 ? (
              <div className="rounded-2xl border bg-white p-4 text-sm text-gray-500">
                No processes found. Try adjusting your search or add a new category.
              </div>
            ) : (
              filteredData.map((category) => {
              const sopForm =
                newSopInputs[category.id] ?? {
                  title: "",
                  owner: PROCESS_CREATOR_NAME,
                  content: "",
                }
              const isEditingCategory = editingCategoryId === category.id
              const newSopDisabled = !sopForm.title.trim()
              const addSopVisible = Boolean(showAddSop[category.id])

              return (
                <div
                  key={category.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    {isEditingCategory ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editingCategoryTitle}
                          onChange={(event) => setEditingCategoryTitle(event.target.value)}
                          className="h-9"
                          placeholder="Update category name"
                        />
                        <button
                          onClick={saveCategoryTitle}
                          disabled={!editingCategoryTitle.trim()}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditCategory}
                          className="rounded-lg border px-3 py-2 text-xs hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => toggle(category.id)}
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          {expanded[category.id] ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          <span className="font-semibold">{category.title}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAddSop(category.id)}
                            aria-pressed={addSopVisible}
                            aria-label="Toggle Add Process"
                            className={cn(
                              "rounded-full p-2 text-gray-500 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                              addSopVisible && "bg-blue-50 text-blue-600 hover:bg-blue-100",
                            )}
                          >
                            <Plus
                              className={cn(
                                "h-4 w-4 transition",
                                addSopVisible && "rotate-45",
                              )}
                            />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                aria-label={`Category actions for ${category.title}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault()
                                  startEditCategory(category)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault()
                                  void handleDeleteCategory(category.id)
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </div>

                  {expanded[category.id] && (
                    <div className="transition-all">
                      <ul className="divide-y">
                        {category.sops.map((sop) => {
                          const isEditingSop = editingSop?.id === sop.id

                          return (
                            <li key={sop.id} className="space-y-2 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                  <FileText className="mt-1 h-5 w-5 shrink-0" />
                                  <div className="min-w-0 space-y-2">
                                    {isEditingSop ? (
                                      <Input
                                        value={editingSop?.title ?? sop.title}
                                        onChange={(event) =>
                                          setEditingSop((prev) =>
                                            prev && prev.id === sop.id
                                              ? { ...prev, title: event.target.value }
                                              : prev,
                                          )
                                        }
                                        className="h-9"
                                        placeholder="Update Process title"
                                      />
                                    ) : (
                                      <>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleSelectSop(sop)}
                                            className="min-w-0 flex-1 truncate text-left font-medium text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                          >
                                            {sop.title}
                                          </button>
                                          <span
                                            className={cn(
                                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                                              SOP_STATUS_BADGE_STYLES[sop.status],
                                            )}
                                          >
                                            {SOP_STATUS_LABELS[sop.status]}
                                          </span>
                                        </div>
                                        <div className="truncate text-xs text-gray-500">
                                          {sop.owner} • Updated {sop.lastUpdated}
                                        </div>
                                      </>
                                    )}

                                    {isEditingSop && (
                                      <div className="space-y-1">
                                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                                          Owner
                                        </Label>
                                        <select
                                          className="w-full rounded-lg border px-3 py-2 text-sm"
                                          value={editingSop?.owner ?? sop.owner}
                                          onChange={(event) =>
                                            setEditingSop((prev) =>
                                              prev && prev.id === sop.id
                                                ? { ...prev, owner: event.target.value }
                                                : prev,
                                            )
                                          }
                                        >
                                          {OWNER_OPTIONS.map((owner) => (
                                            <option key={owner} value={owner}>
                                              {owner}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-shrink-0 items-center gap-2">
                                  {isEditingSop ? (
                                    <>
                                      <button
                                        onClick={saveSopEdit}
                                        className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEditSop}
                                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                          aria-label={`Process actions for ${sop.title}`}
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault()
                                            startEditSop(category.id, sop)
                                          }}
                                        >
                                          <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault()
                                            handleDeleteSop(category.id, sop.id)
                                          }}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>

                      {addSopVisible && (
                        <div className="space-y-4 border-t bg-gray-50 p-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">Add Process</h4>
                            <p className="text-xs text-gray-500">
                              Capture a quick description and starter steps.
                            </p>
                          </div>
                          <Input
                            value={sopForm.title}
                            onChange={(event) =>
                              handleNewSopInputChange(category.id, "title", event.target.value)
                            }
                            placeholder="Process title"
                          />
                          <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-700">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Process owner
                            </div>
                            <div className="font-medium text-gray-900">{PROCESS_CREATOR_NAME}</div>
                            <p className="mt-1 text-xs text-gray-500">
                              Automatically assigned to the process creator.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Import or start from
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {SOP_IMPORT_OPTIONS.map((option) => (
                                <button
                                  key={`${category.id}-${option.id}`}
                                  type="button"
                                  title={option.name}
                                  className="group flex min-w-[72px] flex-col items-center gap-1.5 rounded-md border border-dashed border-gray-200 bg-white p-2 text-[11px] font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
                                >
                                  <option.Logo />
                                  <span className="text-center leading-tight">{option.name}</span>
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setAiPromptDraft(sopForm.content || "")
                                  setAiPromptCategory(category.id)
                                }}
                                aria-label="Generate Process with AI"
                                className={cn(
                                  "group flex min-w-[72px] flex-col items-center gap-1.5 rounded-md border border-dashed border-gray-200 bg-white p-2 text-[11px] font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600",
                                  sopForm.content.trim() && "border-blue-300 text-blue-600 hover:border-blue-300",
                                )}
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                                <span className="text-center leading-tight">AI process</span>
                              </button>
                            </div>
                          </div>
                          {sopForm.content.trim() && (
                            <div className="rounded-lg border border-dashed bg-white px-3 py-2 text-xs text-gray-600">
                              <div className="font-semibold text-gray-700">AI prompt captured</div>
                              <p className="mt-1 whitespace-pre-wrap">{sopForm.content}</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleAddSop(category.id)}
                            disabled={newSopDisabled}
                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Plus className="h-4 w-4" /> Add Process
                          </button>
                          <Dialog
                            open={aiPromptCategory === category.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setAiPromptCategory(null)
                                setAiPromptDraft("")
                              }
                            }}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Generate Process with AI</DialogTitle>
                                <DialogDescription>
                                  Describe the process you want to document and we will craft a starter process.
                                </DialogDescription>
                              </DialogHeader>
                              <Textarea
                                value={aiPromptDraft}
                                onChange={(event) => setAiPromptDraft(event.target.value)}
                                placeholder="e.g. Create an onboarding checklist for new customer success hires"
                              />
                              <DialogFooter>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAiPromptCategory(null)
                                    setAiPromptDraft("")
                                  }}
                                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmedPrompt = aiPromptDraft.trim()
                                    if (trimmedPrompt) {
                                      handleNewSopInputChange(category.id, "content", trimmedPrompt)
                                    }
                                    setAiPromptCategory(null)
                                    setAiPromptDraft("")
                                  }}
                                  disabled={!aiPromptDraft.trim()}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Use prompt
                                </button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        <div
          className={cn(
            "flex flex-col bg-white",
            fullscreen
              ? "fixed inset-0 z-50 h-screen w-screen rounded-none border-0 shadow-none"
              : "rounded-2xl border shadow-sm",
          )}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFullscreen((prev) => !prev)}
                className="rounded-lg p-1 hover:bg-gray-50"
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <div className="font-semibold">Process Viewer</div>
            </div>
            {selectedSOP && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("editor")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "editor" && "bg-gray-100",
                  )}
                >
                  <Pencil className="h-4 w-4" /> Process Editor
                </button>
                <button
                  onClick={() => setViewMode("process")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "process" && "bg-gray-100",
                  )}
                >
                  <ListChecks className="h-4 w-4" /> Process Designer
                </button>
                <button
                  onClick={() => setViewMode("settings")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "settings" && "bg-gray-100",
                  )}
                >
                  <Settings className="h-4 w-4" /> Process Settings
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "calendar" && "bg-gray-100",
                  )}
                >
                  <CalendarIcon className="h-4 w-4" /> Processor Portal
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {!selectedSOP ? (
              <div className="flex h-full flex-col items-center justify-center gap-8 p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-blue-50 p-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bring your Processes into Operations Catalog
                    </h3>
                    <p className="max-w-xl text-sm text-gray-500">
                      Upload process documents from the tools your teams already use so everything lives in one organized
                      workspace.
                    </p>
                  </div>
                </div>
                <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {SOP_IMPORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <option.Logo />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{option.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{option.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:text-blue-400" />
                    </button>
                  ))}
                </div>
                <div className="w-full max-w-2xl text-left">
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-900">Generate a new process with AI</h4>
                        <p className="text-xs text-gray-500">
                          Describe the process you need and add it directly to your catalog.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <Input
                        value={processViewerPromptTitle}
                        onChange={(event) => setProcessViewerPromptTitle(event.target.value)}
                        placeholder="Process title"
                      />
                      <Textarea
                        value={processViewerPrompt}
                        onChange={(event) => setProcessViewerPrompt(event.target.value)}
                        placeholder="Describe the process you want to generate"
                        className="min-h-[120px]"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-gray-400">
                          You'll choose a category after submitting your prompt.
                        </p>
                        <button
                          type="button"
                          onClick={handleSubmitProcessViewerPrompt}
                          disabled={processViewerPromptDisabled}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Sparkles className="h-4 w-4" /> Continue
                        </button>
                      </div>
                    </div>
                  </div>
                  <Dialog
                    open={showCategorySelection}
                    onOpenChange={(open) => {
                      if (!open) {
                        setShowCategorySelection(false)
                        setPendingProcessViewerPrompt(null)
                      }
                    }}
                  >
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select a category</DialogTitle>
                        <DialogDescription>
                          {pendingProcessViewerTitle
                            ? `Choose where “${pendingProcessViewerTitle}” belongs in your catalog.`
                            : "Choose where this process belongs in your catalog."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select
                          value={selectedCategoryForViewerPrompt}
                          onValueChange={setSelectedCategoryForViewerPrompt}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {pendingProcessViewerPrompt && (
                          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                            <div className="font-semibold text-gray-700">AI prompt</div>
                            <p className="mt-1 whitespace-pre-wrap">{pendingProcessViewerPrompt.prompt}</p>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategorySelection(false)
                            setPendingProcessViewerPrompt(null)
                          }}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmProcessViewerPrompt}
                          disabled={!selectedCategoryForViewerPrompt}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Add process
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-gray-400">
                  More import options coming soon. You can also upload files directly from your device.
                </p>
              </div>
            ) : (
              <div className="h-full">
                <div
                  className={cn(
                    "flex h-full flex-col overflow-y-auto",
                    viewMode !== "editor" && "hidden",
                  )}
                >
                  <ProcessEditor
                    value={selectedSOP.content}
                    onChange={(value) => updateSOP(selectedSOP.id, value)}
                  />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-hidden",
                    viewMode !== "process" && "hidden",
                  )}
                >
                  <ProcessView
                    tasks={tasks}
                    setTasks={setTasks}
                    onLastProcessDeadlineChange={handleOneTimeDeadlineUpdate}
                    onWorkflowUpdate={handleWorkflowUpdate}
                  />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-y-auto p-4",
                    viewMode !== "calendar" && "hidden",
                  )}
                >
                  <CalendarView
                    tasks={tasks}
                    workflow={currentWorkflow}
                    processName={selectedSOP?.title ?? ""}
                    outputSubmissions={outputSubmissions}
                    onSubmitOutput={handleOutputSubmission}
                  />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-y-auto p-4",
                    viewMode !== "settings" && "hidden",
                  )}
                >
                  <ProcessSettingsView
                    settings={processSettings}
                    onChange={handleProcessSettingsChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
