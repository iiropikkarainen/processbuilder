export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type GenericTable<Row extends Record<string, unknown> = Record<string, unknown>> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      service_desks: {
        Row: {
          id: string
          name: string
          purpose: string | null
          samples: string[] | null
          owner_email: string | null
          owning_team: string | null
          ai_enabled: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          purpose?: string | null
          samples?: string[] | null
          owner_email?: string | null
          owning_team?: string | null
          ai_enabled?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          purpose?: string | null
          samples?: string[] | null
          owner_email?: string | null
          owning_team?: string | null
          ai_enabled?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      tickets: GenericTable
      ticket_comments: GenericTable
      ticket_assignments: GenericTable
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          full_name?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
