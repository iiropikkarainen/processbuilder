import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/types/supabase"
import type {
  NodeData,
  ProcessDeadline,
  Task,
  Workflow,
  WorkflowNode,
} from "@/lib/types"

export type SopStatus = "active" | "in-design" | "inactive"

export interface OperationsProcessSummary {
  id: string
  title: string
  category: string
}

export interface CatalogSubcategory {
  id: string
  title: string
}

export interface ProcessSettingsData {
  owner: string
  processType: "one-time" | "recurring"
  oneTimeDeadline: ProcessDeadline | null
  recurrence: {
    frequency:
      | "custom"
      | "daily"
      | "weekly"
      | "monthly"
      | "quarterly"
      | "annually"
    customDays: string[]
    time: string
    timezone: string
  }
  vaultAccess: string[]
}

export interface CatalogSop {
  id: string
  title: string
  subcategoryId: string
  owner: string
  lastUpdated: string
  status: SopStatus
  content: string
  processSettings: ProcessSettingsData
}

export interface CatalogCategory {
  id: string
  title: string
  subcategories: CatalogSubcategory[]
  sops: CatalogSop[]
}

export interface OperationsCatalogData {
  categories: CatalogCategory[]
  tasksByProcessId: Record<string, Task[]>
  workflowByProcessId: Record<string, Workflow>
  processSettingsByProcessId: Record<string, ProcessSettingsData>
}

type CategoryRow = Database["public"]["Tables"]["operations_categories"]["Row"]
type SubcategoryRow = Database["public"]["Tables"]["operations_subcategories"]["Row"]
type ProcessRow = Database["public"]["Tables"]["processes"]["Row"]
type ProcessSettingsRow = Database["public"]["Tables"]["process_settings"]["Row"]
type ProcessNodeRow = Database["public"]["Tables"]["process_nodes"]["Row"]
type ProcessTaskRow = Database["public"]["Tables"]["process_tasks"]["Row"]
type UserRow = Database["public"]["Tables"]["users"]["Row"]

type UserMap = Map<string, UserRow>

type Supabase = SupabaseClient<Database>

type ProcessSettingsByProcessId = Record<string, ProcessSettingsData>

type WorkflowByProcessId = Record<string, Workflow>

type TasksByProcessId = Record<string, Task[]>

export interface MetadataTask {
  id: string
  text: string
  due?: string | null
  completed?: boolean
  completedBy?: string | null
  completedAt?: string | null
}

export interface ProcessMetadata {
  ownerDisplayName?: string
  oneTimeDeadline?: ProcessDeadline | null
  backlogTasks?: MetadataTask[]
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

const isMetadataTask = (value: unknown): value is MetadataTask => {
  if (!value || typeof value !== "object") {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.id === "string" && typeof record.text === "string"
}

export const parseProcessMetadata = (value?: string | null): ProcessMetadata => {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value) as Partial<ProcessMetadata>
    const metadata: ProcessMetadata = {}

    if (parsed.ownerDisplayName && typeof parsed.ownerDisplayName === "string") {
      metadata.ownerDisplayName = parsed.ownerDisplayName
    }

    if (parsed.oneTimeDeadline) {
      metadata.oneTimeDeadline = parsed.oneTimeDeadline as ProcessDeadline
    }

    if (Array.isArray(parsed.backlogTasks)) {
      metadata.backlogTasks = parsed.backlogTasks.filter(isMetadataTask)
    }

    return metadata
  } catch (error) {
    console.error("Failed to parse process metadata", error)
    return {}
  }
}

export const serializeProcessMetadata = (metadata: ProcessMetadata): string =>
  JSON.stringify(metadata)

export const convertMetadataTaskToTask = (task: MetadataTask): Task => ({
  id: task.id,
  text: task.text,
  due: task.due ?? "",
  completed: task.completed ?? false,
  completedBy: task.completedBy ?? "",
  completedAt: task.completedAt ?? null,
  nodeId: null,
})

export const convertTaskToMetadataTask = (task: Task): MetadataTask => ({
  id: task.id,
  text: task.text,
  due: task.due || null,
  completed: task.completed,
  completedBy: task.completedBy || null,
  completedAt: task.completedAt ?? null,
})

const SUPPORTED_STATUSES: SopStatus[] = ["active", "in-design", "inactive"]

const buildDefaultProcessSettings = (): ProcessSettingsData => ({
  owner: "Unassigned",
  processType: "one-time",
  oneTimeDeadline: null,
  recurrence: {
    frequency: "monthly",
    customDays: [],
    time: "09:00",
    timezone: "UTC",
  },
  vaultAccess: [],
})

const normaliseDate = (value?: string | null): string => {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toISOString().split("T")[0] ?? ""
}

const normaliseTime = (value?: string | null): string => {
  if (!value) {
    return "09:00"
  }

  if (value.length >= 5) {
    return value.slice(0, 5)
  }

  return value
}

const coerceStatus = (value?: string | null): SopStatus => {
  if (!value) {
    return "in-design"
  }

  const normalised = value.toLowerCase()
  return (SUPPORTED_STATUSES.find((status) => status === normalised) ?? "in-design") as SopStatus
}

const getUserDisplayName = (user?: UserRow): string => {
  if (!user) {
    return "Unassigned"
  }

  if (user.full_name && user.full_name.trim()) {
    return user.full_name
  }

  if (user.email && user.email.trim()) {
    return user.email
  }

  return "Unassigned"
}

const mapProcessSettings = (
  row: ProcessSettingsRow | null,
  userMap: UserMap,
  metadata?: ProcessMetadata,
): ProcessSettingsData => {
  const defaultSettings = buildDefaultProcessSettings()

  const ownerName = metadata?.ownerDisplayName
    ?? (row?.owner ? getUserDisplayName(userMap.get(row.owner)) : defaultSettings.owner)

  return {
    owner: ownerName,
    processType: row?.process_type ?? defaultSettings.processType,
    oneTimeDeadline: metadata?.oneTimeDeadline ?? defaultSettings.oneTimeDeadline,
    recurrence: {
      frequency: (row?.frequency as ProcessSettingsData["recurrence"]["frequency"]) ??
        defaultSettings.recurrence.frequency,
      customDays: row?.custom_days ?? defaultSettings.recurrence.customDays,
      time: normaliseTime(row?.time),
      timezone: row?.timezone ?? defaultSettings.recurrence.timezone,
    },
    vaultAccess: row?.vault_access ?? defaultSettings.vaultAccess,
  }
}

const mapNodeType = (value: string | null): WorkflowNode["type"] => {
  switch (value) {
    case "input":
    case "output":
    case "process":
    case "code":
      return value
    case "decision":
      return "conditional"
    default:
      return "process"
  }
}

const mapWorkflow = (processId: string, rows: ProcessNodeRow[]): Workflow => {
  if (!rows.length) {
    return { nodes: [], edges: [] }
  }

  const nodes: WorkflowNode[] = rows.map((row, index) => {
    const position = (row.position as { x?: number; y?: number } | null) ?? null
    const baseData: Partial<NodeData> = typeof row.config === "object" && row.config !== null
      ? (row.config as NodeData)
      : {}

    return {
      id: row.id,
      type: mapNodeType(row.node_type),
      position: {
        x: typeof position?.x === "number" ? position.x : 200,
        y: typeof position?.y === "number" ? position.y : index * 160,
      },
      data: {
        ...baseData,
        label: row.label ?? baseData.label ?? "",
        description: row.description ?? baseData.description,
        required: typeof row.required === "boolean" ? row.required : baseData.required,
      },
    }
  })

  const edges = nodes.flatMap((node) => {
    const data = node.data as NodeData
    const predecessors = Array.isArray(data.predecessorNodeIds) ? data.predecessorNodeIds : []
    return predecessors
      .filter((sourceId) => sourceId && sourceId !== node.id)
      .map((sourceId) => ({
        id: `${processId}-${sourceId}-${node.id}`,
        source: sourceId,
        target: node.id,
        type: "custom",
      }))
  })

  return { nodes, edges }
}

const mapTask = (row: ProcessTaskRow, userMap: UserMap): Task => ({
  id: row.id,
  text: row.text,
  due: row.due_date ?? "",
  completed: row.completed ?? false,
  completedBy: row.completed_by ? getUserDisplayName(userMap.get(row.completed_by)) : "",
  completedAt: row.completed_at ?? null,
  nodeId: row.node_id ?? null,
})

const groupTasksByProcess = (
  taskRows: ProcessTaskRow[] | null,
  nodeProcessMap: Map<string, string>,
  userMap: UserMap,
): TasksByProcessId => {
  const tasksByProcessId: TasksByProcessId = {}

  if (!taskRows) {
    return tasksByProcessId
  }

  for (const row of taskRows) {
    const processId = nodeProcessMap.get(row.node_id)
    if (!processId) {
      continue
    }

    if (!tasksByProcessId[processId]) {
      tasksByProcessId[processId] = []
    }

    tasksByProcessId[processId].push(mapTask(row, userMap))
  }

  for (const processId of Object.keys(tasksByProcessId)) {
    tasksByProcessId[processId].sort((a, b) => a.text.localeCompare(b.text))
  }

  return tasksByProcessId
}

export async function fetchOperationsProcessSummaries(
  supabase: Supabase,
  orgId: string,
): Promise<OperationsProcessSummary[]> {
  const { data: processRows, error: processesError } = await supabase
    .from("processes")
    .select("id, name, subcategory_id")
    .eq("org_id", orgId)

  if (processesError) {
    throw new Error(`Failed to load processes: ${processesError.message}`)
  }

  if (!processRows?.length) {
    return []
  }

  const subcategoryIds = Array.from(
    new Set(processRows.map((row) => row.subcategory_id).filter((value): value is string => Boolean(value))),
  )

  const { data: subcategoryRows, error: subcategoryError } = subcategoryIds.length
    ? await supabase
        .from("operations_subcategories")
        .select("id, title, category_id")
        .in("id", subcategoryIds)
    : { data: [] as SubcategoryRow[], error: null }

  if (subcategoryError) {
    throw new Error(`Failed to load subcategories: ${subcategoryError.message}`)
  }

  const categoryIds = Array.from(new Set(subcategoryRows.map((row) => row.category_id)))

  const { data: categoryRows, error: categoryError } = categoryIds.length
    ? await supabase
        .from("operations_categories")
        .select("id, title")
        .in("id", categoryIds)
    : { data: [] as CategoryRow[], error: null }

  if (categoryError) {
    throw new Error(`Failed to load categories: ${categoryError.message}`)
  }

  const categoryTitleById = new Map(categoryRows.map((row) => [row.id, row.title]))
  const subcategoryCategoryTitle = new Map(
    subcategoryRows.map((row) => [row.id, categoryTitleById.get(row.category_id) ?? "Uncategorized"]),
  )

  return processRows
    .map((row) => ({
      id: row.id,
      title: row.name,
      category: row.subcategory_id
        ? subcategoryCategoryTitle.get(row.subcategory_id) ?? "Uncategorized"
        : "Uncategorized",
    }))
    .sort((a, b) => {
      const categoryComparison = a.category.localeCompare(b.category)
      if (categoryComparison !== 0) {
        return categoryComparison
      }

      return a.title.localeCompare(b.title)
    })
}

export async function fetchOperationsCatalogData(
  supabase: Supabase,
  orgId: string,
): Promise<OperationsCatalogData> {
  const { data: categoryRows, error: categoriesError } = await supabase
    .from("operations_categories")
    .select("id, title")
    .eq("org_id", orgId)
    .order("title", { ascending: true })

  if (categoriesError) {
    throw new Error(`Failed to load operations categories: ${categoriesError.message}`)
  }

  const { data: processRows, error: processesError } = await supabase
    .from("processes")
    .select(
      "id, name, status, subcategory_id, content, last_updated, updated_at, created_at, description",
    )
    .eq("org_id", orgId)

  if (processesError) {
    throw new Error(`Failed to load processes: ${processesError.message}`)
  }

  const metadataByProcessId = new Map<string, ProcessMetadata>()
  processRows?.forEach((row) => {
    metadataByProcessId.set(row.id, parseProcessMetadata(row.description))
  })

  const categoryIds = categoryRows?.map((row) => row.id) ?? []

  const { data: subcategoryRows, error: subcategoryError } = categoryIds.length
    ? await supabase
        .from("operations_subcategories")
        .select("id, title, category_id")
        .in("category_id", categoryIds)
    : { data: [] as SubcategoryRow[], error: null }

  if (subcategoryError) {
    throw new Error(`Failed to load subcategories: ${subcategoryError.message}`)
  }

  const processIds = processRows?.map((row) => row.id) ?? []

  const { data: settingsRows, error: settingsError } = processIds.length
    ? await supabase
        .from("process_settings")
        .select(
          "process_id, owner, process_type, frequency, custom_days, time, timezone, vault_access, created_at, updated_at",
        )
        .in("process_id", processIds)
    : { data: [] as ProcessSettingsRow[], error: null }

  if (settingsError) {
    throw new Error(`Failed to load process settings: ${settingsError.message}`)
  }

  const { data: nodeRows, error: nodesError } = processIds.length
    ? await supabase
        .from("process_nodes")
        .select("id, process_id, label, description, required, node_type, config, position")
        .in("process_id", processIds)
    : { data: [] as ProcessNodeRow[], error: null }

  if (nodesError) {
    throw new Error(`Failed to load process nodes: ${nodesError.message}`)
  }

  const nodeIds = nodeRows?.map((row) => row.id) ?? []

  const { data: taskRows, error: tasksError } = nodeIds.length
    ? await supabase
        .from("process_tasks")
        .select("id, node_id, text, due_date, completed, completed_by, completed_at, created_at")
        .in("node_id", nodeIds)
    : { data: [] as ProcessTaskRow[], error: null }

  if (tasksError) {
    throw new Error(`Failed to load process tasks: ${tasksError.message}`)
  }

  const userIds = new Set<string>()
  settingsRows?.forEach((row) => {
    if (row.owner) {
      userIds.add(row.owner)
    }
  })
  taskRows?.forEach((row) => {
    if (row.completed_by) {
      userIds.add(row.completed_by)
    }
  })

  let userMap: UserMap = new Map()

  if (userIds.size > 0) {
    const { data: userRows, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", Array.from(userIds))

    if (usersError) {
      throw new Error(`Failed to load users: ${usersError.message}`)
    }

    userMap = new Map((userRows ?? []).map((row) => [row.id, row]))
  }

  const processSettingsByProcessId: ProcessSettingsByProcessId = {}
  settingsRows?.forEach((row) => {
    processSettingsByProcessId[row.process_id] = mapProcessSettings(
      row,
      userMap,
      metadataByProcessId.get(row.process_id),
    )
  })

  const nodesByProcess = new Map<string, ProcessNodeRow[]>()
  nodeRows?.forEach((row) => {
    const list = nodesByProcess.get(row.process_id) ?? []
    list.push(row)
    nodesByProcess.set(row.process_id, list)
  })

  const workflowByProcessId: WorkflowByProcessId = {}
  nodesByProcess.forEach((rows, processId) => {
    workflowByProcessId[processId] = mapWorkflow(processId, rows)
  })

  const nodeProcessMap = new Map<string, string>()
  nodeRows?.forEach((row) => {
    nodeProcessMap.set(row.id, row.process_id)
  })

  const tasksByProcessId = groupTasksByProcess(taskRows ?? null, nodeProcessMap, userMap)

  metadataByProcessId.forEach((metadata, processId) => {
    if (!metadata.backlogTasks || metadata.backlogTasks.length === 0) {
      return
    }

    if (!tasksByProcessId[processId]) {
      tasksByProcessId[processId] = []
    }

    metadata.backlogTasks.forEach((task) => {
      tasksByProcessId[processId].push(convertMetadataTaskToTask(task))
    })

    tasksByProcessId[processId].sort((a, b) => a.text.localeCompare(b.text))
  })

  const categoriesMap = new Map<string, CatalogCategory>()
  categoryRows?.forEach((row) => {
    categoriesMap.set(row.id, {
      id: row.id,
      title: row.title,
      subcategories: [],
      sops: [],
    })
  })

  const categoryBySubcategory = new Map<string, string>()
  subcategoryRows?.forEach((row) => {
    categoryBySubcategory.set(row.id, row.category_id)
    const category = categoriesMap.get(row.category_id)
    if (category) {
      category.subcategories.push({ id: row.id, title: row.title })
    }
  })

  const uncategorized: CatalogSop[] = []

  processRows?.forEach((row) => {
    const metadata = metadataByProcessId.get(row.id)
    const settings = processSettingsByProcessId[row.id]
      ?? mapProcessSettings(null, userMap, metadata)
    if (!processSettingsByProcessId[row.id]) {
      processSettingsByProcessId[row.id] = settings
    }

    if (!tasksByProcessId[row.id]) {
      tasksByProcessId[row.id] = []
    }

    if (!workflowByProcessId[row.id]) {
      workflowByProcessId[row.id] = { nodes: [], edges: [] }
    }

    const sop: CatalogSop = {
      id: row.id,
      title: row.name,
      subcategoryId: row.subcategory_id ?? "",
      owner: settings.owner,
      lastUpdated: normaliseDate(row.last_updated ?? row.updated_at ?? row.created_at),
      status: coerceStatus(row.status),
      content: row.content ?? "",
      processSettings: settings,
    }

    const categoryId = row.subcategory_id ? categoryBySubcategory.get(row.subcategory_id) : undefined

    if (categoryId && categoriesMap.has(categoryId)) {
      categoriesMap.get(categoryId)!.sops.push(sop)
    } else {
      uncategorized.push(sop)
    }
  })

  const categories = Array.from(categoriesMap.values())
  categories.forEach((category) => {
    category.subcategories.sort((a, b) => a.title.localeCompare(b.title))
    category.sops.sort((a, b) => a.title.localeCompare(b.title))
  })
  categories.sort((a, b) => a.title.localeCompare(b.title))

  if (uncategorized.length > 0) {
    uncategorized.sort((a, b) => a.title.localeCompare(b.title))
    categories.push({
      id: "uncategorized",
      title: "Uncategorized",
      subcategories: [],
      sops: uncategorized,
    })
  }

  return {
    categories,
    tasksByProcessId,
    workflowByProcessId,
    processSettingsByProcessId,
  }
}

const mapWorkflowNodeTypeToDb = (type: WorkflowNode["type"] | undefined): string => {
  switch (type) {
    case "input":
    case "output":
    case "process":
    case "code":
      return type
    case "conditional":
      return "decision"
    default:
      return "process"
  }
}

const updateProcessMetadata = async (
  supabase: Supabase,
  processId: string,
  metadata: ProcessMetadata,
): Promise<void> => {
  const { error } = await supabase
    .from("processes")
    .update({ description: serializeProcessMetadata(metadata) })
    .eq("id", processId)

  if (error) {
    throw new Error(`Failed to update process metadata: ${error.message}`)
  }
}

const toSettingsPayload = (
  processId: string,
  settings: ProcessSettingsData,
): Database["public"]["Tables"]["process_settings"]["Insert"] => ({
  process_id: processId,
  process_type: settings.processType,
  frequency: settings.recurrence.frequency,
  custom_days: settings.recurrence.customDays,
  time: settings.recurrence.time,
  timezone: settings.recurrence.timezone,
  vault_access: settings.vaultAccess,
  owner: null,
})

export async function createOperationsCategory(
  supabase: Supabase,
  orgId: string,
  title: string,
): Promise<{ category: CategoryRow; subcategory: SubcategoryRow }> {
  const slug = slugify(title) || `category-${Date.now()}`
  const timestamp = new Date().toISOString()

  const { data: category, error: categoryError } = await supabase
    .from("operations_categories")
    .insert({
      org_id: orgId,
      title,
      slug,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select("id, title, org_id, slug, created_at, updated_at")
    .single()

  if (categoryError) {
    throw new Error(`Failed to create category: ${categoryError.message}`)
  }

  const subcategorySlug = `${slug}-general`
  const { data: subcategory, error: subcategoryError } = await supabase
    .from("operations_subcategories")
    .insert({
      category_id: category.id,
      title: "General",
      slug: subcategorySlug,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select("id, title, category_id, slug, created_at, updated_at")
    .single()

  if (subcategoryError) {
    throw new Error(`Failed to create default subcategory: ${subcategoryError.message}`)
  }

  return { category, subcategory }
}

export async function updateOperationsCategory(
  supabase: Supabase,
  categoryId: string,
  title: string,
): Promise<void> {
  const slug = slugify(title) || `category-${Date.now()}`
  const { error } = await supabase
    .from("operations_categories")
    .update({ title, slug, updated_at: new Date().toISOString() })
    .eq("id", categoryId)

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`)
  }
}

export async function deleteOperationsProcessCascade(
  supabase: Supabase,
  processId: string,
): Promise<void> {
  const { data: nodeRows, error: nodesError } = await supabase
    .from("process_nodes")
    .select("id")
    .eq("process_id", processId)

  if (nodesError) {
    throw new Error(`Failed to fetch process nodes: ${nodesError.message}`)
  }

  const nodeIds = (nodeRows ?? []).map((row) => row.id)

  if (nodeIds.length > 0) {
    const { error: tasksError } = await supabase
      .from("process_tasks")
      .delete()
      .in("node_id", nodeIds)

    if (tasksError) {
      throw new Error(`Failed to delete process tasks: ${tasksError.message}`)
    }

    const { error: deleteNodesError } = await supabase
      .from("process_nodes")
      .delete()
      .in("id", nodeIds)

    if (deleteNodesError) {
      throw new Error(`Failed to delete process nodes: ${deleteNodesError.message}`)
    }
  }

  const { error: settingsError } = await supabase
    .from("process_settings")
    .delete()
    .eq("process_id", processId)

  if (settingsError) {
    throw new Error(`Failed to delete process settings: ${settingsError.message}`)
  }

  const { error: historyError } = await supabase
    .from("process_editor_history")
    .delete()
    .eq("process_id", processId)

  if (historyError) {
    throw new Error(`Failed to delete process history: ${historyError.message}`)
  }

  const { error: processError } = await supabase.from("processes").delete().eq("id", processId)

  if (processError) {
    throw new Error(`Failed to delete process: ${processError.message}`)
  }
}

export async function deleteOperationsCategoryCascade(
  supabase: Supabase,
  categoryId: string,
): Promise<void> {
  const { data: subcategories, error: subcategoryError } = await supabase
    .from("operations_subcategories")
    .select("id")
    .eq("category_id", categoryId)

  if (subcategoryError) {
    throw new Error(`Failed to load subcategories: ${subcategoryError.message}`)
  }

  const subcategoryIds = (subcategories ?? []).map((row) => row.id)

  if (subcategoryIds.length > 0) {
    const { data: processes, error: processesError } = await supabase
      .from("processes")
      .select("id")
      .in("subcategory_id", subcategoryIds)

    if (processesError) {
      throw new Error(`Failed to load processes for category: ${processesError.message}`)
    }

    await Promise.all(
      (processes ?? []).map((row) => deleteOperationsProcessCascade(supabase, row.id)),
    )

    const { error: deleteSubcategoriesError } = await supabase
      .from("operations_subcategories")
      .delete()
      .in("id", subcategoryIds)

    if (deleteSubcategoriesError) {
      throw new Error(`Failed to delete subcategories: ${deleteSubcategoriesError.message}`)
    }
  }

  const { error: deleteCategoryError } = await supabase
    .from("operations_categories")
    .delete()
    .eq("id", categoryId)

  if (deleteCategoryError) {
    throw new Error(`Failed to delete category: ${deleteCategoryError.message}`)
  }
}

export interface CreateOperationsProcessInput {
  orgId: string
  subcategoryId: string
  title: string
  content: string
  status?: SopStatus
  settings: ProcessSettingsData
  metadata: ProcessMetadata
}

export async function createOperationsProcess(
  supabase: Supabase,
  input: CreateOperationsProcessInput,
): Promise<{ process: ProcessRow; settings: ProcessSettingsData }> {
  const timestamp = new Date().toISOString()

  const { data: process, error: processError } = await supabase
    .from("processes")
    .insert({
      org_id: input.orgId,
      name: input.title,
      status: input.status ?? "in-design",
      subcategory_id: input.subcategoryId,
      content: input.content,
      description: serializeProcessMetadata(input.metadata),
      last_updated: timestamp,
      updated_at: timestamp,
    })
    .select(
      "id, name, status, subcategory_id, content, last_updated, updated_at, created_at, description",
    )
    .single()

  if (processError || !process) {
    throw new Error(`Failed to create process: ${processError?.message ?? "Unknown error"}`)
  }

  const settingsPayload = toSettingsPayload(process.id, input.settings)
  settingsPayload.created_at = timestamp
  settingsPayload.updated_at = timestamp

  const { error: settingsError } = await supabase
    .from("process_settings")
    .upsert(settingsPayload, { onConflict: "process_id" })

  if (settingsError) {
    throw new Error(`Failed to create process settings: ${settingsError.message}`)
  }

  return { process, settings: input.settings }
}

export async function updateOperationsProcess(
  supabase: Supabase,
  processId: string,
  updates: {
    title?: string
    status?: SopStatus
    metadata?: ProcessMetadata
  },
): Promise<void> {
  const payload: Partial<ProcessRow> = {}

  if (typeof updates.title === "string") {
    payload.name = updates.title
  }

  if (typeof updates.status === "string") {
    payload.status = updates.status
  }

  if (updates.metadata) {
    payload.description = serializeProcessMetadata(updates.metadata)
  }

  if (Object.keys(payload).length === 0) {
    return
  }

  payload.updated_at = new Date().toISOString()

  const { error } = await supabase.from("processes").update(payload).eq("id", processId)

  if (error) {
    throw new Error(`Failed to update process: ${error.message}`)
  }
}

export async function saveProcessContent(
  supabase: Supabase,
  processId: string,
  content: string,
  metadata: ProcessMetadata,
  editorUserId?: string,
): Promise<void> {
  const timestamp = new Date().toISOString()
  const { error } = await supabase
    .from("processes")
    .update({
      content,
      last_updated: timestamp,
      updated_at: timestamp,
      description: serializeProcessMetadata(metadata),
    })
    .eq("id", processId)

  if (error) {
    throw new Error(`Failed to save process content: ${error.message}`)
  }

  if (editorUserId) {
    await supabase.from("process_editor_history").insert({
      process_id: processId,
      edited_by: editorUserId,
      content,
      created_at: timestamp,
    })
  }
}

export async function saveProcessSettings(
  supabase: Supabase,
  processId: string,
  settings: ProcessSettingsData,
  metadata: ProcessMetadata,
): Promise<void> {
  const payload = toSettingsPayload(processId, settings)
  payload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from("process_settings")
    .upsert(payload, { onConflict: "process_id" })

  if (error) {
    throw new Error(`Failed to save process settings: ${error.message}`)
  }

  await updateProcessMetadata(supabase, processId, metadata)
}

export async function saveProcessWorkflow(
  supabase: Supabase,
  processId: string,
  workflow: Workflow,
  previousNodeIds: string[],
): Promise<void> {
  const nodeRows = workflow.nodes.map((node) => ({
    id: node.id,
    process_id: processId,
    label: node.data?.label ?? "",
    description: node.data?.description ?? null,
    required: typeof node.data?.required === "boolean" ? node.data.required : null,
    node_type: mapWorkflowNodeTypeToDb(node.type),
    config: node.data ?? {},
    position: node.position ?? null,
  }))

  const newNodeIds = nodeRows.map((row) => row.id)
  const removedNodeIds = previousNodeIds.filter((id) => !newNodeIds.includes(id))

  if (removedNodeIds.length > 0) {
    const { error: deleteTasksError } = await supabase
      .from("process_tasks")
      .delete()
      .in("node_id", removedNodeIds)

    if (deleteTasksError) {
      throw new Error(`Failed to remove tasks for deleted nodes: ${deleteTasksError.message}`)
    }

    const { error: deleteNodesError } = await supabase
      .from("process_nodes")
      .delete()
      .in("id", removedNodeIds)

    if (deleteNodesError) {
      throw new Error(`Failed to delete nodes: ${deleteNodesError.message}`)
    }
  }

  if (nodeRows.length > 0) {
    const { error } = await supabase
      .from("process_nodes")
      .upsert(nodeRows, { onConflict: "id" })

    if (error) {
      throw new Error(`Failed to save process workflow: ${error.message}`)
    }
  } else {
    const { error } = await supabase.from("process_nodes").delete().eq("process_id", processId)

    if (error) {
      throw new Error(`Failed to clear process workflow: ${error.message}`)
    }
  }
}

export async function saveProcessTasks(
  supabase: Supabase,
  processId: string,
  tasks: Task[],
  nodeIds: string[],
  metadata: ProcessMetadata,
): Promise<void> {
  const assignedTasks = tasks.filter((task) => task.nodeId && nodeIds.includes(task.nodeId))
  const assignedIds = new Set(assignedTasks.map((task) => task.id))

  const nodeIdsForQuery = nodeIds.length > 0 ? nodeIds : []

  if (nodeIdsForQuery.length > 0) {
    const { data: existingTasks, error: existingError } = await supabase
      .from("process_tasks")
      .select("id")
      .in("node_id", nodeIdsForQuery)

    if (existingError) {
      throw new Error(`Failed to load existing tasks: ${existingError.message}`)
    }

    const toDelete = (existingTasks ?? [])
      .filter((row) => !assignedIds.has(row.id))
      .map((row) => row.id)

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("process_tasks")
        .delete()
        .in("id", toDelete)

      if (deleteError) {
        throw new Error(`Failed to delete tasks: ${deleteError.message}`)
      }
    }
  }

  if (assignedTasks.length > 0) {
    const upsertPayload = assignedTasks.map((task) => ({
      id: task.id,
      node_id: task.nodeId!,
      text: task.text,
      due_date: task.due || null,
      completed: task.completed,
      completed_by: null,
      completed_at: task.completedAt,
    }))

    const { error } = await supabase
      .from("process_tasks")
      .upsert(upsertPayload, { onConflict: "id" })

    if (error) {
      throw new Error(`Failed to save tasks: ${error.message}`)
    }
  }

  await updateProcessMetadata(
    supabase,
    processId,
    {
      ...metadata,
      backlogTasks: metadata.backlogTasks ?? [],
    },
  )
}
