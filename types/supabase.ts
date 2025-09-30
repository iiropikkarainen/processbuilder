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
      operations_categories: {
        Row: {
          id: string
          title: string
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          created_at?: string | null
        }
        Relationships: []
      }
      processes: {
        Row: {
          id: string
          org_id: string | null
          name: string
          description: string | null
          status: string | null
          content: string | null
          category_id: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          org_id?: string | null
          name: string
          description?: string | null
          status?: string | null
          content?: string | null
          category_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string | null
          name?: string
          description?: string | null
          status?: string | null
          content?: string | null
          category_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          code: string | null
          title: string | null
          description: string | null
          status: string | null
          priority: string | null
          requested_by: string | null
          submitted_at: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
          service_desk_id: string | null
          sla_due_at: string | null
          linked_process_id: string | null
        }
        Insert: {
          id?: string
          code?: string | null
          title?: string | null
          description?: string | null
          status?: string | null
          priority?: string | null
          requested_by?: string | null
          submitted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          service_desk_id?: string | null
          sla_due_at?: string | null
          linked_process_id?: string | null
        }
        Update: {
          id?: string
          code?: string | null
          title?: string | null
          description?: string | null
          status?: string | null
          priority?: string | null
          requested_by?: string | null
          submitted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          service_desk_id?: string | null
          sla_due_at?: string | null
          linked_process_id?: string | null
        }
        Relationships: []
      }
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
