"use client"

import { useEffect } from "react"

import type { ServiceDeskRequest } from "@/lib/data/service-desk-requests"

const STORAGE_KEY = "processbuilder:service-desk:requests"
export const SERVICE_DESK_REQUEST_CREATED_EVENT = "service-desk:request-created"

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function loadStoredRequests(): ServiceDeskRequest[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    if (!storedValue) {
      return []
    }

    const parsed = JSON.parse(storedValue) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is ServiceDeskRequest => {
      return Boolean(item && typeof item === "object" && "id" in item && "deskId" in item)
    })
  } catch (error) {
    console.error("Failed to load service desk requests from storage", error)
    return []
  }
}

function saveStoredRequests(requests: ServiceDeskRequest[]) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export function addStoredRequest(request: ServiceDeskRequest) {
  if (!isBrowser()) {
    return
  }

  const existing = loadStoredRequests()
  const next = [...existing.filter((item) => item.id !== request.id), request]

  saveStoredRequests(next)
  window.dispatchEvent(new CustomEvent(SERVICE_DESK_REQUEST_CREATED_EVENT, { detail: request }))
}

export function useStoredRequestsSubscription(onChange: (requests: ServiceDeskRequest[]) => void) {
  useEffect(() => {
    if (!isBrowser()) {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        onChange(loadStoredRequests())
      }
    }

    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ServiceDeskRequest | ServiceDeskRequest[]>
      const detail = customEvent.detail
      if (!detail) {
        return
      }

      if (Array.isArray(detail)) {
        onChange(detail)
      } else {
        onChange(loadStoredRequests())
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(SERVICE_DESK_REQUEST_CREATED_EVENT, handleCustomEvent)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(SERVICE_DESK_REQUEST_CREATED_EVENT, handleCustomEvent)
    }
  }, [onChange])
}
