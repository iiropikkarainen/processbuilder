"use client"

import {
  Bold,
  ClipboardCopy,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const SAFELIST_CLASSNAMES =
  "process-checklist space-y-2 list-none pl-0 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 font-semibold text-blue-600 border-dashed border-purple-200 bg-purple-50 text-purple-700 text-purple-600 process-ai-block process-callout process-code-block bg-slate-950 text-slate-100 text-xs text-gray-700 text-gray-900 text-gray-500 bg-gray-50 border-gray-200"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function convertInputToHtml(value: string) {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return value
  }
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("")
}

function convertPlainTextToHtml(value: string) {
  if (!value) return ""
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("")
}

function sanitizeHtml(value: string) {
  if (!value) return ""
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/\son[a-z]+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
}

function splitSelectionLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/\u00a0/g, " ").trim())
    .filter((line) => line.length > 0)
}

function stripHeadingMarkers(line: string) {
  return line.replace(/^#{1,6}\s*/, "").trim()
}

function stripQuoteMarker(line: string) {
  return line.replace(/^>\s?/, "").trim()
}

function stripListMarkers(line: string) {
  return line
    .replace(/^([-*+])\s+/, "")
    .replace(/^(\d+)([.)])\s+/, "")
    .replace(/^[a-zA-Z]([.)])\s+/, "")
    .replace(/^\(?(\d+)\)?\s+/, "")
    .trim()
}

function parseChecklistLine(line: string) {
  const match = line.match(/^[-*+]?\s*\[(\s|x|X)\]\s*(.*)$/)
  if (match) {
    return {
      text: match[2]?.trim() ?? "",
      checked: match[1]?.toLowerCase() === "x",
    }
  }
  return {
    text: stripListMarkers(line),
    checked: false,
  }
}

type ListContext = {
  type: "ol" | "ul"
  index: number
}

export function extractPlainText(html: string) {
  if (!html) return ""

  const fallback = html
    .replace(/<br\s*\/?>(?=\n?)/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "\n")
    .replace(/<blockquote[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")

  if (typeof window === "undefined" || typeof window.DOMParser === "undefined") {
    return fallback.replace(/\n{3,}/g, "\n\n").trim()
  }

  const parser = new window.DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html")
  const parts: string[] = []

  const traverse = (node: Node, context?: ListContext) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ""
      if (text) {
        parts.push(text)
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const element = node as HTMLElement
    switch (element.tagName.toLowerCase()) {
      case "br": {
        parts.push("\n")
        return
      }
      case "p":
      case "div":
      case "section":
      case "article":
      case "blockquote": {
        element.childNodes.forEach((child) => traverse(child, context))
        parts.push("\n")
        return
      }
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        parts.push("\n")
        element.childNodes.forEach((child) => traverse(child, context))
        parts.push("\n")
        return
      }
      case "ol": {
        let counter = 1
        element.childNodes.forEach((child) => {
          traverse(child, { type: "ol", index: counter })
          if (
            child.nodeType === Node.ELEMENT_NODE &&
            (child as HTMLElement).tagName.toLowerCase() === "li"
          ) {
            counter += 1
          }
        })
        parts.push("\n")
        return
      }
      case "ul": {
        element.childNodes.forEach((child) => {
          traverse(child, { type: "ul", index: 0 })
        })
        parts.push("\n")
        return
      }
      case "li": {
        if (context?.type === "ol") {
          parts.push(`${context.index}. `)
        } else {
          parts.push("• ")
        }
        element.childNodes.forEach((child) => traverse(child, context))
        parts.push("\n")
        return
      }
      case "table":
      case "tbody":
      case "thead":
      case "tr":
      case "td":
      case "th": {
        element.childNodes.forEach((child) => traverse(child, context))
        return
      }
      default: {
        element.childNodes.forEach((child) => traverse(child, context))
      }
    }
  }

  doc.body.childNodes.forEach((child) => traverse(child))

  const text = parts
    .join("")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")

  const cleaned = text.split("\n").map((line) => line.trimEnd()).join("\n")

  return cleaned.trim()
}

type ToolbarAction = {
  id: string
  label: string
  icon: LucideIcon
  shortcut?: string
  isActive?: boolean
  onSelect: () => void
}

type SlashMenuItem = {
  value: string
  label: string
  description: string
  keywords?: string[]
}

type SlashMenuSection = {
  title: string
  items: SlashMenuItem[]
}

type SlashMenuState = {
  top: number
  left: number
  query: string
}

const SLASH_MENU_SECTIONS: SlashMenuSection[] = [
  {
    title: "Structure",
    items: [
      {
        value: "heading-1",
        label: "Heading 1",
        description: "Large section heading",
        keywords: ["title", "h1", "section"],
      },
      {
        value: "heading-2",
        label: "Heading 2",
        description: "Sub-section heading",
        keywords: ["subtitle", "h2"],
      },
      {
        value: "numbered-list",
        label: "Numbered list",
        description: "Create ordered steps",
        keywords: ["ordered", "steps"],
      },
      {
        value: "bullet-list",
        label: "Bullet list",
        description: "Summarize supporting details",
        keywords: ["unordered", "bullets"],
      },
      {
        value: "checklist",
        label: "Checklist",
        description: "Track completion with checkboxes",
        keywords: ["tasks", "todo"],
      },
    ],
  },
  {
    title: "Insert",
    items: [
      {
        value: "quote",
        label: "Quote block",
        description: "Highlight key reminders",
        keywords: ["blockquote", "callout"],
      },
      {
        value: "callout",
        label: "Callout",
        description: "Add contextual guidance",
        keywords: ["note", "info"],
      },
      {
        value: "divider",
        label: "Divider",
        description: "Break sections with a divider",
        keywords: ["rule", "separator"],
      },
      {
        value: "code",
        label: "Code block",
        description: "Document scripts or commands",
        keywords: ["script", "terminal"],
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        value: "ai-prompt",
        label: "AI prompt",
        description: "Capture a prompt for assistants",
        keywords: ["ai", "prompt", "assistant"],
      },
      {
        value: "process-link",
        label: "Link to process",
        description: "Reference another process",
        keywords: ["link", "reference"],
      },
    ],
  },
]

function filterSlashMenuSections(
  sections: SlashMenuSection[],
  query: string,
): SlashMenuSection[] {
  if (!query) return sections
  const lowered = query.toLowerCase()
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const haystack = [
          item.label.toLowerCase(),
          item.description.toLowerCase(),
          ...(item.keywords?.map((keyword) => keyword.toLowerCase()) ?? []),
        ].join(" ")
        return haystack.includes(lowered)
      }),
    }))
    .filter((section) => section.items.length > 0)
}

interface SlashMenuProps {
  state: SlashMenuState | null
  sections: SlashMenuSection[]
  activeIndex: number
  onSelect: (item: SlashMenuItem) => void
}

function SlashMenu({ state, sections, activeIndex, onSelect }: SlashMenuProps) {
  if (!state) return null

  const flattened: SlashMenuItem[] = sections.flatMap((section) => section.items)
  const hasResults = flattened.length > 0

  return (
    <div
      className="absolute z-50 w-80 rounded-xl border border-border bg-popover p-3 shadow-lg"
      style={{ top: state.top, left: state.left }}
    >
      {hasResults ? (
        <>
          {sections.map((section) => (
            <div key={section.title} className="mb-3 last:mb-0">
              <div className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </div>
              <div className="mt-1 space-y-1">
                {section.items.map((item) => {
                  const index = flattened.findIndex((candidate) => candidate.value === item.value)
                  const isActive = index === activeIndex
                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => onSelect(item)}
                      className={cn(
                        "w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm transition",
                        isActive ? "border-primary/30 bg-primary/5 text-primary" : "hover:bg-muted",
                      )}
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {state.query && (
            <div className="mt-3 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Showing results for “{state.query}”
            </div>
          )}
        </>
      ) : (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          No commands found for “{state.query || "/"}”
        </div>
      )}
    </div>
  )
}

function useSelectionListener(callback: () => void) {
  useEffect(() => {
    const handler = () => callback()
    document.addEventListener("selectionchange", handler)
    return () => {
      document.removeEventListener("selectionchange", handler)
    }
  }, [callback])
}

interface ProcessEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function ProcessEditor({
  value,
  onChange,
  placeholder = "Outline each step, use / for quick commands...",
}: ProcessEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [internalValue, setInternalValue] = useState(() => sanitizeHtml(convertInputToHtml(value)))
  const [isEmpty, setIsEmpty] = useState(() => extractPlainText(value).length === 0)
  const [isFocused, setIsFocused] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved")
  const [slashState, setSlashState] = useState<SlashMenuState | null>(null)
  const [slashIndex, setSlashIndex] = useState(0)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    orderedList: false,
    unorderedList: false,
    quote: false,
    heading1: false,
    heading2: false,
  })
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const savedSelectionRef = useRef<Range | null>(null)

  useEffect(() => {
    const normalized = sanitizeHtml(convertInputToHtml(value))
    if (normalized === internalValue) return
    setInternalValue(normalized)
    if (editorRef.current && editorRef.current.innerHTML !== normalized) {
      editorRef.current.innerHTML = normalized
    }
    setIsEmpty(extractPlainText(normalized).length === 0)
  }, [value, internalValue])

  useEffect(() => {
    if (!editorRef.current) {
      return
    }
    editorRef.current.innerHTML = internalValue || ""
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const plainText = useMemo(() => extractPlainText(internalValue), [internalValue])
  const wordCount = useMemo(
    () => (plainText ? plainText.split(/\s+/).filter(Boolean).length : 0),
    [plainText],
  )
  const charCount = useMemo(() => plainText.length, [plainText])
  const readingTime = useMemo(
    () => Math.max(1, Math.ceil(wordCount / 180)),
    [wordCount],
  )

  const filteredSections = useMemo(
    () => (slashState ? filterSlashMenuSections(SLASH_MENU_SECTIONS, slashState.query) : []),
    [slashState],
  )

  const flattenedSlashItems = useMemo(() => filteredSections.flatMap((section) => section.items), [
    filteredSections,
  ])

  useEffect(() => {
    if (slashState) {
      setSlashIndex(0)
    }
  }, [slashState?.query])

  const updateFormats = useCallback(() => {
    if (typeof window === "undefined") return
    let blockValue = ""
    try {
      blockValue = (document.queryCommandValue("formatBlock") as string).toLowerCase()
    } catch (error) {
      blockValue = ""
    }
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strike: document.queryCommandState("strikeThrough"),
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      quote: blockValue === "blockquote",
      heading1: blockValue === "h1",
      heading2: blockValue === "h2",
    })
  }, [])

  const triggerChange = useCallback(() => {
    if (!editorRef.current) return
    const rawHtml = editorRef.current.innerHTML
    const sanitized = sanitizeHtml(rawHtml)
    setInternalValue(sanitized)
    onChange(sanitized)
    setIsEmpty(extractPlainText(sanitized).length === 0)
    setSaveStatus("saving")
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saved")
    }, 600)
  }, [onChange])

  const saveSelection = useCallback(() => {
    if (typeof window === "undefined") return
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    try {
      const range = selection.getRangeAt(0)
      if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
        return
      }
      savedSelectionRef.current = range.cloneRange()
    } catch (error) {
      return
    }
  }, [])

  const restoreSelection = useCallback(() => {
    if (typeof window === "undefined") return
    const editor = editorRef.current
    const range = savedSelectionRef.current
    if (!editor || !range) return
    try {
      if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
        return
      }
    } catch (error) {
      return
    }
    const selection = window.getSelection()
    if (!selection) return
    selection.removeAllRanges()
    selection.addRange(range)
  }, [])

  const getSelectionDetails = useCallback(() => {
    if (typeof window === "undefined") return null
    const editor = editorRef.current
    if (!editor) return null
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null
    const range = selection.getRangeAt(0)
    try {
      if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
        return null
      }
    } catch (error) {
      return null
    }
    const fragment = range.cloneContents()
    const container = document.createElement("div")
    container.appendChild(fragment)
    const text = container.textContent ?? ""
    return {
      text,
      isCollapsed: selection.isCollapsed,
    }
  }, [])

  const updateSlashMenu = useCallback(() => {
    if (typeof window === "undefined") return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setSlashState(null)
      return
    }

    if (!selection.isCollapsed) {
      setSlashState(null)
      return
    }

    const anchorNode = selection.anchorNode
    if (!anchorNode) {
      setSlashState(null)
      return
    }

    if (editorRef.current && !editorRef.current.contains(anchorNode)) {
      setSlashState(null)
      return
    }

    const textContent = anchorNode.textContent ?? ""
    const textBefore = textContent.slice(0, selection.anchorOffset)
    const match = textBefore.match(/\/(\w[\w-]*)?$/)

    if (!match) {
      setSlashState(null)
      return
    }

    const range = selection.getRangeAt(0).cloneRange()
    const rect = range.getBoundingClientRect()
    const containerRect = editorRef.current?.getBoundingClientRect()

    if (!rect || !containerRect) {
      setSlashState(null)
      return
    }

    setSlashState({
      top: rect.bottom - containerRect.top + 10,
      left: rect.left - containerRect.left,
      query: (match[1] ?? "").toLowerCase(),
    })
  }, [])

  const removeSlashTrigger = useCallback(() => {
    if (typeof window === "undefined") return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const anchorNode = selection.anchorNode
    if (!anchorNode || anchorNode.nodeType !== Node.TEXT_NODE) return
    const text = anchorNode.textContent ?? ""
    const prefix = text.slice(0, selection.anchorOffset)
    const match = prefix.match(/\/(\w[\w-]*)?$/)
    if (!match) return
    const updatedPrefix = prefix.slice(0, -match[0].length)
    const suffix = text.slice(selection.anchorOffset)
    const updatedText = `${updatedPrefix}${suffix}`
    anchorNode.textContent = updatedText
    const offset = updatedPrefix.length
    const newRange = document.createRange()
    newRange.setStart(anchorNode, Math.min(offset, anchorNode.textContent?.length ?? 0))
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)
  }, [])

  const handleSelectionChange = useCallback(() => {
    saveSelection()
    updateFormats()
    updateSlashMenu()
  }, [saveSelection, updateFormats, updateSlashMenu])

  useSelectionListener(handleSelectionChange)

  const applyCommand = useCallback(
    (command: string, value?: string) => {
      if (typeof window === "undefined") return
      if (!editorRef.current) return
      restoreSelection()
      editorRef.current.focus({ preventScroll: true })
      restoreSelection()
      const commandValue =
        command === "formatBlock" && value && !value.startsWith("<")
          ? `<${value}>`
          : value
      document.execCommand(command, false, commandValue)
      updateFormats()
      setTimeout(() => {
        triggerChange()
      }, 0)
    },
    [restoreSelection, triggerChange, updateFormats],
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
      event.preventDefault()
      applyCommand("bold")
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
      event.preventDefault()
      applyCommand("italic")
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "u") {
      event.preventDefault()
      applyCommand("underline")
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "7") {
      event.preventDefault()
      insertList("ol")
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "8") {
      event.preventDefault()
      insertList("ul")
      return
    }
    if (event.key === "Tab") {
      event.preventDefault()
      applyCommand(event.shiftKey ? "outdent" : "indent")
      return
    }
    if (slashState) {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setSlashIndex((prev) => {
          if (!flattenedSlashItems.length) return prev
          return (prev + 1) % flattenedSlashItems.length
        })
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        setSlashIndex((prev) => {
          if (!flattenedSlashItems.length) return prev
          return (prev - 1 + flattenedSlashItems.length) % flattenedSlashItems.length
        })
        return
      }
      if (event.key === "Enter") {
        const item = flattenedSlashItems[slashIndex]
        if (item) {
          event.preventDefault()
          handleSlashSelect(item)
        }
        return
      }
      if (event.key === "Escape") {
        setSlashState(null)
        return
      }
    }
  }

  const handleInput = () => {
    triggerChange()
    updateSlashMenu()
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData("text/plain")
    if (text) {
      document.execCommand("insertHTML", false, convertPlainTextToHtml(text))
      triggerChange()
    }
  }

  const insertHeading = useCallback(
    (level: 1 | 2) => {
      if (!editorRef.current) return
      restoreSelection()
      editorRef.current.focus({ preventScroll: true })
      restoreSelection()
      const details = getSelectionDetails()
      const isCollapsed = details?.isCollapsed ?? true
      const placeholder = level === 1 ? "Heading 1" : "Heading 2"
      const lines = details ? splitSelectionLines(details.text).map(stripHeadingMarkers) : []
      const filtered = lines.filter((line) => line.length > 0)
      const content = filtered.length > 0 ? filtered : [placeholder]
      const html = content
        .map((line) => `<h${level}>${escapeHtml(line)}</h${level}>`)
        .join("")
      const finalHtml = isCollapsed ? `${html}<p><br /></p>` : html
      document.execCommand("insertHTML", false, finalHtml)
      updateFormats()
      setTimeout(() => {
        triggerChange()
      }, 0)
    },
    [getSelectionDetails, restoreSelection, triggerChange, updateFormats],
  )

  const insertList = useCallback(
    (type: "ol" | "ul") => {
      if (!editorRef.current) return
      restoreSelection()
      editorRef.current.focus({ preventScroll: true })
      restoreSelection()
      const details = getSelectionDetails()
      const isCollapsed = details?.isCollapsed ?? true
      const lines = details ? splitSelectionLines(details.text).map(stripListMarkers) : []
      const items = lines.filter((line) => line.length > 0)
      const content = items.length > 0 ? items : ["List item"]
      const listHtml = `<${type}>${content
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</${type}>`
      const finalHtml = isCollapsed ? `${listHtml}<p><br /></p>` : listHtml
      document.execCommand("insertHTML", false, finalHtml)
      updateFormats()
      setTimeout(() => {
        triggerChange()
      }, 0)
    },
    [getSelectionDetails, restoreSelection, triggerChange, updateFormats],
  )

  const insertChecklist = useCallback(() => {
    if (!editorRef.current) return
    restoreSelection()
    editorRef.current.focus({ preventScroll: true })
    restoreSelection()
    const details = getSelectionDetails()
    const isCollapsed = details?.isCollapsed ?? true
    const lines = details ? splitSelectionLines(details.text) : []
    const parsed = lines.map(parseChecklistLine).filter((item) => item.text.length > 0)
    const items = parsed.length > 0 ? parsed : [{ text: "Checklist item", checked: false }]
    const listHtml = `<ul class="process-checklist space-y-2 list-none pl-0">${items
      .map(
        (item) =>
          `<li><label class="flex items-center gap-2"><input type="checkbox" class="h-4 w-4 rounded border border-gray-300"${
            item.checked ? " checked" : ""
          } /><span>${escapeHtml(item.text || "Checklist item")}</span></label></li>`,
      )
      .join("")}</ul>`
    const finalHtml = isCollapsed ? `${listHtml}<p><br /></p>` : listHtml
    document.execCommand("insertHTML", false, finalHtml)
    updateFormats()
    setTimeout(() => {
      triggerChange()
    }, 0)
  }, [getSelectionDetails, restoreSelection, triggerChange, updateFormats])

  const insertQuote = useCallback(() => {
    if (!editorRef.current) return
    restoreSelection()
    editorRef.current.focus({ preventScroll: true })
    restoreSelection()
    const details = getSelectionDetails()
    const isCollapsed = details?.isCollapsed ?? true
    const lines = details ? splitSelectionLines(details.text).map(stripQuoteMarker) : []
    const filtered = lines.filter((line) => line.length > 0)
    const content = filtered.length > 0 ? filtered.join("\n") : "Quote"
    const quoteHtml = `<blockquote>${escapeHtml(content).replace(/\n/g, "<br />")}</blockquote>`
    const finalHtml = isCollapsed ? `${quoteHtml}<p><br /></p>` : quoteHtml
    document.execCommand("insertHTML", false, finalHtml)
    updateFormats()
    setTimeout(() => {
      triggerChange()
    }, 0)
  }, [getSelectionDetails, restoreSelection, triggerChange, updateFormats])

  const insertCallout = useCallback(() => {
    if (!editorRef.current) return
    restoreSelection()
    editorRef.current.focus({ preventScroll: true })
    restoreSelection()
    const calloutHtml = `
      <div class="process-callout rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p class="text-sm font-semibold text-blue-700">Callout</p>
        <p class="mt-1 text-sm text-blue-600">Add a quick reminder or operational nuance.</p>
      </div><p><br /></p>
    `
    document.execCommand("insertHTML", false, calloutHtml)
    triggerChange()
  }, [restoreSelection, triggerChange])

  const insertDivider = useCallback(() => {
    if (!editorRef.current) return
    restoreSelection()
    editorRef.current.focus({ preventScroll: true })
    restoreSelection()
    document.execCommand("insertHorizontalRule", false)
    triggerChange()
  }, [restoreSelection, triggerChange])

  const insertCodeBlock = useCallback(() => {
    if (!editorRef.current) return
    restoreSelection()
    editorRef.current.focus({ preventScroll: true })
    restoreSelection()
    const codeBlock = `
      <pre class="process-code-block overflow-x-auto rounded-lg bg-slate-950 px-4 py-3 text-sm text-slate-100"><code>// Document the script or command</code></pre><p><br /></p>
    `
    document.execCommand("insertHTML", false, codeBlock)
    triggerChange()
  }, [restoreSelection, triggerChange])

  const insertAiPrompt = useCallback(() => {
    if (!editorRef.current) return
    restoreSelection()
    editorRef.current.focus({ preventScroll: true })
    restoreSelection()
    const aiBlock = `
      <div class="process-ai-block rounded-lg border border-dashed border-purple-200 bg-purple-50 px-4 py-3">
        <p class="flex items-center gap-2 text-sm font-semibold text-purple-700"><span>AI Prompt</span></p>
        <p class="mt-1 text-xs text-purple-600">Document how AI should assist with this step.</p>
      </div><p><br /></p>
    `
    document.execCommand("insertHTML", false, aiBlock)
    triggerChange()
  }, [restoreSelection, triggerChange])

  const insertProcessLink = useCallback(() => {
    if (!editorRef.current) return
    restoreSelection()
    editorRef.current.focus({ preventScroll: true })
    restoreSelection()
    const linkBlock = `
      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p class="text-sm font-semibold text-gray-900">Linked process</p>
        <p class="mt-1 text-xs text-gray-500">Paste a URL or reference ID to connect related SOPs.</p>
      </div><p><br /></p>
    `
    document.execCommand("insertHTML", false, linkBlock)
    triggerChange()
  }, [restoreSelection, triggerChange])

  const handleLink = () => {
    if (typeof window === "undefined") return
    const url = window.prompt("Enter the URL")
    if (!url) return
    const normalized = url.startsWith("http") ? url : `https://${url}`
    applyCommand("createLink", normalized)
  }

  const handleSlashSelect = (item: SlashMenuItem) => {
    removeSlashTrigger()
    setSlashState(null)
    setSlashIndex(0)
    switch (item.value) {
      case "heading-1":
        insertHeading(1)
        break
      case "heading-2":
        insertHeading(2)
        break
      case "numbered-list":
        insertList("ol")
        break
      case "bullet-list":
        insertList("ul")
        break
      case "checklist":
        insertChecklist()
        break
      case "quote":
        insertQuote()
        break
      case "callout":
        insertCallout()
        break
      case "divider":
        insertDivider()
        break
      case "code":
        insertCodeBlock()
        break
      case "ai-prompt":
        insertAiPrompt()
        break
      case "process-link":
        insertProcessLink()
        break
      default:
        break
    }
  }

  const toolbarActions: ToolbarAction[] = [
    {
      id: "bold",
      label: "Bold",
      icon: Bold,
      shortcut: "⌘B",
      isActive: activeFormats.bold,
      onSelect: () => applyCommand("bold"),
    },
    {
      id: "italic",
      label: "Italic",
      icon: Italic,
      shortcut: "⌘I",
      isActive: activeFormats.italic,
      onSelect: () => applyCommand("italic"),
    },
    {
      id: "underline",
      label: "Underline",
      icon: Underline,
      shortcut: "⌘U",
      isActive: activeFormats.underline,
      onSelect: () => applyCommand("underline"),
    },
    {
      id: "strike",
      label: "Strikethrough",
      icon: Strikethrough,
      isActive: activeFormats.strike,
      onSelect: () => applyCommand("strikeThrough"),
    },
    {
      id: "heading1",
      label: "Heading 1",
      icon: Heading1,
      isActive: activeFormats.heading1,
      onSelect: () => insertHeading(1),
    },
    {
      id: "heading2",
      label: "Heading 2",
      icon: Heading2,
      isActive: activeFormats.heading2,
      onSelect: () => insertHeading(2),
    },
    {
      id: "ordered",
      label: "Numbered list",
      icon: ListOrdered,
      shortcut: "⇧⌘7",
      isActive: activeFormats.orderedList,
      onSelect: () => insertList("ol"),
    },
    {
      id: "unordered",
      label: "Bulleted list",
      icon: List,
      shortcut: "⇧⌘8",
      isActive: activeFormats.unorderedList,
      onSelect: () => insertList("ul"),
    },
    {
      id: "checklist",
      label: "Checklist",
      icon: ListChecks,
      onSelect: () => insertChecklist(),
    },
    {
      id: "quote",
      label: "Quote",
      icon: Quote,
      isActive: activeFormats.quote,
      onSelect: insertQuote,
    },
    {
      id: "divider",
      label: "Divider",
      icon: Minus,
      onSelect: insertDivider,
    },
    {
      id: "code",
      label: "Code block",
      icon: ClipboardCopy,
      onSelect: insertCodeBlock,
    },
    {
      id: "ai",
      label: "AI prompt",
      icon: Sparkles,
      onSelect: insertAiPrompt,
    },
    {
      id: "link",
      label: "Link",
      icon: Link2,
      onSelect: handleLink,
    },
    {
      id: "undo",
      label: "Undo",
      icon: Undo2,
      shortcut: "⌘Z",
      onSelect: () => applyCommand("undo"),
    },
    {
      id: "redo",
      label: "Redo",
      icon: Redo2,
      shortcut: "⇧⌘Z",
      onSelect: () => applyCommand("redo"),
    },
  ]

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b bg-muted/40 px-4 py-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Process documentation</p>
                <p className="text-xs text-muted-foreground">
                  Rich formatting, AI prompts, and checklists for your SOPs
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                {saveStatus === "saving" ? "Saving changes…" : "All changes saved"}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg border border-border/70 bg-background px-2 py-1.5">
              {toolbarActions.map((action) => (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={action.isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-8 min-w-[2rem] px-2 text-xs",
                        action.isActive && "border border-primary/20",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={action.onSelect}
                    >
                      <action.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs font-medium">{action.label}</div>
                    {action.shortcut && (
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {action.shortcut}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex-1">
          <ScrollArea className="h-full">
            <div className="relative px-6 pb-16 pt-6">
              <div className="hidden" aria-hidden data-safelist={SAFELIST_CLASSNAMES} />
              <div className="relative">
                {isEmpty && !isFocused && (
                  <div className="pointer-events-none absolute left-0 top-0 select-none text-sm text-muted-foreground">
                    {placeholder}
                  </div>
                )}
                <div
                  ref={editorRef}
                  className="process-editor-content space-y-4 text-sm leading-6 text-foreground outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0"
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck
                  onInput={handleInput}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    setIsFocused(false)
                    setSlashState(null)
                  }}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  aria-label="Process editor"
                />
              </div>
            </div>
          </ScrollArea>
          <SlashMenu
            state={slashState}
            sections={filteredSections}
            activeIndex={slashIndex}
            onSelect={handleSlashSelect}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span>{wordCount} words</span>
            <Separator orientation="vertical" className="hidden h-4 lg:flex" />
            <span>{charCount} characters</span>
            <Separator orientation="vertical" className="hidden h-4 lg:flex" />
            <span>~{readingTime} min read</span>
          </div>
          <span>Press “/” for quick commands</span>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default ProcessEditor
