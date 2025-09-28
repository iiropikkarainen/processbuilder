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
      operations_categories: {
        Row: {
          created_at: string
          id: string
          org_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      operations_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      process_editor_history: {
        Row: {
          content: string
          created_at: string
          edited_by: string
          id: string
          process_id: string
        }
        Insert: {
          content: string
          created_at?: string
          edited_by: string
          id?: string
          process_id: string
        }
        Update: {
          content?: string
          created_at?: string
          edited_by?: string
          id?: string
          process_id?: string
        }
        Relationships: []
      }
      process_nodes: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          label: string
          node_type: string | null
          position: Json | null
          process_id: string
          required: boolean | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          node_type?: string | null
          position?: Json | null
          process_id: string
          required?: boolean | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          node_type?: string | null
          position?: Json | null
          process_id?: string
          required?: boolean | null
        }
        Relationships: []
      }
      process_settings: {
        Row: {
          created_at: string | null
          custom_days: string[] | null
          frequency: string | null
          id: string
          owner: string | null
          process_id: string
          process_type: "one-time" | "recurring"
          time: string | null
          timezone: string | null
          updated_at: string | null
          vault_access: string[] | null
        }
        Insert: {
          created_at?: string | null
          custom_days?: string[] | null
          frequency?: string | null
          id?: string
          owner?: string | null
          process_id: string
          process_type: "one-time" | "recurring"
          time?: string | null
          timezone?: string | null
          updated_at?: string | null
          vault_access?: string[] | null
        }
        Update: {
          created_at?: string | null
          custom_days?: string[] | null
          frequency?: string | null
          id?: string
          owner?: string | null
          process_id?: string
          process_type?: "one-time" | "recurring"
          time?: string | null
          timezone?: string | null
          updated_at?: string | null
          vault_access?: string[] | null
        }
        Relationships: []
      }
      process_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          due_date: string | null
          id: string
          node_id: string
          text: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          node_id: string
          text: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          node_id?: string
          text?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_updated: string | null
          name: string
          org_id: string
          status: string
          subcategory_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_updated?: string | null
          name: string
          org_id: string
          status?: string
          subcategory_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          org_id?: string
          status?: string
          subcategory_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      processor_assignments: {
        Row: {
          assigned_at: string | null
          assigned_to: string
          id: string
          status: string | null
          task_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to: string
          id?: string
          status?: string | null
          task_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string
          id?: string
          status?: string | null
          task_id?: string
        }
        Relationships: []
      }
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
