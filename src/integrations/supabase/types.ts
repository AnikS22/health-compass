export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_daily_rollups: {
        Row: {
          active_students: number
          active_teachers: number
          avg_confidence: number
          completion_rate: number
          id: string
          metric_date: string
          organization_id: string
        }
        Insert: {
          active_students?: number
          active_teachers?: number
          avg_confidence?: number
          completion_rate?: number
          id?: string
          metric_date: string
          organization_id: string
        }
        Update: {
          active_students?: number
          active_teachers?: number
          avg_confidence?: number
          completion_rate?: number
          id?: string
          metric_date?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_rollups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_targets: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          target_ref_id: string
          target_type: Database["public"]["Enums"]["assignment_target_type"]
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          target_ref_id: string
          target_type: Database["public"]["Enums"]["assignment_target_type"]
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          target_ref_id?: string
          target_type?: Database["public"]["Enums"]["assignment_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assignment_targets_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_by_user_id: string
          class_id: string
          created_at: string
          due_at: string | null
          id: string
          lesson_version_id: string
          organization_id: string
        }
        Insert: {
          assigned_by_user_id: string
          class_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          lesson_version_id: string
          organization_id: string
        }
        Update: {
          assigned_by_user_id?: string
          class_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          lesson_version_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_by_user_id_fkey"
            columns: ["assigned_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_responses: {
        Row: {
          confidence: number | null
          id: string
          independent_attempt_id: string
          lesson_block_id: string
          response_payload: Json
          score: number | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          id?: string
          independent_attempt_id: string
          lesson_block_id: string
          response_payload?: Json
          score?: number | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          id?: string
          independent_attempt_id?: string
          lesson_block_id?: string
          response_payload?: Json
          score?: number | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_responses_independent_attempt_id_fkey"
            columns: ["independent_attempt_id"]
            isOneToOne: false
            referencedRelation: "independent_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_responses_lesson_block_id_fkey"
            columns: ["lesson_block_id"]
            isOneToOne: false
            referencedRelation: "lesson_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_step_progress: {
        Row: {
          independent_attempt_id: string
          lesson_block_id: string
          score: number | null
          status: Database["public"]["Enums"]["step_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          independent_attempt_id: string
          lesson_block_id: string
          score?: number | null
          status: Database["public"]["Enums"]["step_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          independent_attempt_id?: string
          lesson_block_id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["step_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_step_progress_independent_attempt_id_fkey"
            columns: ["independent_attempt_id"]
            isOneToOne: false
            referencedRelation: "independent_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_step_progress_lesson_block_id_fkey"
            columns: ["lesson_block_id"]
            isOneToOne: false
            referencedRelation: "lesson_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_step_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_key: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_key: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_key?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_identities: {
        Row: {
          created_at: string
          external_subject: string | null
          id: string
          password_hash: string | null
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_subject?: string | null
          id?: string
          password_hash?: string | null
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_subject?: string | null
          id?: string
          password_hash?: string | null
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      block_assets: {
        Row: {
          asset_type: string
          asset_url: string
          captions_url: string | null
          created_at: string
          id: string
          lesson_block_id: string
          metadata: Json
        }
        Insert: {
          asset_type: string
          asset_url: string
          captions_url?: string | null
          created_at?: string
          id?: string
          lesson_block_id: string
          metadata?: Json
        }
        Update: {
          asset_type?: string
          asset_url?: string
          captions_url?: string | null
          created_at?: string
          id?: string
          lesson_block_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "block_assets_lesson_block_id_fkey"
            columns: ["lesson_block_id"]
            isOneToOne: false
            referencedRelation: "lesson_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_url: string | null
          id: string
          issued_at: string
          lesson_version_id: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          id?: string
          issued_at?: string
          lesson_version_id: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          id?: string
          issued_at?: string
          lesson_version_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          accommodations: Json
          class_id: string
          created_at: string
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodations?: Json
          class_id: string
          created_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodations?: Json
          class_id?: string
          created_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_join_codes: {
        Row: {
          class_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          join_code: string
        }
        Insert: {
          class_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          join_code: string
        }
        Update: {
          class_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          join_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_join_codes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          grade_band: string
          id: string
          name: string
          organization_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade_band: string
          id?: string
          name: string
          organization_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade_band?: string
          id?: string
          name?: string
          organization_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          curriculum_package_id: string | null
          grade_band: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          curriculum_package_id?: string | null
          grade_band: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          curriculum_package_id?: string | null
          grade_band?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_curriculum_package_id_fkey"
            columns: ["curriculum_package_id"]
            isOneToOne: false
            referencedRelation: "curriculum_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_packages: {
        Row: {
          created_at: string
          id: string
          package_key: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_key: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          package_key?: string
          title?: string
        }
        Relationships: []
      }
      global_analytics_daily: {
        Row: {
          id: string
          metric_date: string
          retention_d7: number
          total_finishes: number
          total_joins: number
          total_starts: number
        }
        Insert: {
          id?: string
          metric_date: string
          retention_d7?: number
          total_finishes?: number
          total_joins?: number
          total_starts?: number
        }
        Update: {
          id?: string
          metric_date?: string
          retention_d7?: number
          total_finishes?: number
          total_joins?: number
          total_starts?: number
        }
        Relationships: []
      }
      independent_attempts: {
        Row: {
          assignment_id: string
          completed_at: string | null
          id: string
          progress_percent: number
          started_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          id?: string
          progress_percent?: number
          started_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          id?: string
          progress_percent?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "independent_attempts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "independent_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_blocks: {
        Row: {
          block_type: Database["public"]["Enums"]["block_type"]
          body: string | null
          config: Json
          created_at: string
          hints: Json
          id: string
          is_gate: boolean
          lesson_version_id: string
          mastery_rules: Json
          remediation_config: Json
          remediation_target_block_id: string | null
          sequence_no: number
          title: string | null
        }
        Insert: {
          block_type: Database["public"]["Enums"]["block_type"]
          body?: string | null
          config?: Json
          created_at?: string
          hints?: Json
          id?: string
          is_gate?: boolean
          lesson_version_id: string
          mastery_rules?: Json
          remediation_config?: Json
          remediation_target_block_id?: string | null
          sequence_no: number
          title?: string | null
        }
        Update: {
          block_type?: Database["public"]["Enums"]["block_type"]
          body?: string | null
          config?: Json
          created_at?: string
          hints?: Json
          id?: string
          is_gate?: boolean
          lesson_version_id?: string
          mastery_rules?: Json
          remediation_config?: Json
          remediation_target_block_id?: string | null
          sequence_no?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_blocks_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_remediation_target_block_id_fkey"
            columns: ["remediation_target_block_id"]
            isOneToOne: false
            referencedRelation: "lesson_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_standard_tags: {
        Row: {
          lesson_id: string
          standards_tag_id: string
        }
        Insert: {
          lesson_id: string
          standards_tag_id: string
        }
        Update: {
          lesson_id?: string
          standards_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_standard_tags_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_standard_tags_standards_tag_id_fkey"
            columns: ["standards_tag_id"]
            isOneToOne: false
            referencedRelation: "standards_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_versions: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          publish_status: Database["public"]["Enums"]["publish_status"]
          published_at: string | null
          version_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          publish_status?: Database["public"]["Enums"]["publish_status"]
          published_at?: string | null
          version_label: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          publish_status?: Database["public"]["Enums"]["publish_status"]
          published_at?: string | null
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_versions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          difficulty: string | null
          estimated_minutes: number | null
          grade_band: string | null
          id: string
          learning_objectives: Json
          required_materials: Json
          sensitive_topic_flags: Json
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          estimated_minutes?: number | null
          grade_band?: string | null
          id?: string
          learning_objectives?: Json
          required_materials?: Json
          sensitive_topic_flags?: Json
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          estimated_minutes?: number | null
          grade_band?: string | null
          id?: string
          learning_objectives?: Json
          required_materials?: Json
          sensitive_topic_flags?: Json
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      license_entitlements: {
        Row: {
          created_at: string
          curriculum_package_id: string
          id: string
          is_enabled: boolean
          license_id: string
        }
        Insert: {
          created_at?: string
          curriculum_package_id: string
          id?: string
          is_enabled?: boolean
          license_id: string
        }
        Update: {
          created_at?: string
          curriculum_package_id?: string
          id?: string
          is_enabled?: boolean
          license_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_entitlements_curriculum_package_id_fkey"
            columns: ["curriculum_package_id"]
            isOneToOne: false
            referencedRelation: "curriculum_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_entitlements_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string
          plan_name: string
          seat_limit: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id: string
          plan_name: string
          seat_limit?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          plan_name?: string
          seat_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      live_group_artifacts: {
        Row: {
          artifact_payload: Json
          created_at: string
          id: string
          lesson_block_id: string | null
          live_group_id: string
        }
        Insert: {
          artifact_payload?: Json
          created_at?: string
          id?: string
          lesson_block_id?: string | null
          live_group_id: string
        }
        Update: {
          artifact_payload?: Json
          created_at?: string
          id?: string
          lesson_block_id?: string | null
          live_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_group_artifacts_lesson_block_id_fkey"
            columns: ["lesson_block_id"]
            isOneToOne: false
            referencedRelation: "lesson_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_group_artifacts_live_group_id_fkey"
            columns: ["live_group_id"]
            isOneToOne: false
            referencedRelation: "live_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      live_group_members: {
        Row: {
          joined_at: string
          live_group_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          live_group_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          live_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_group_members_live_group_id_fkey"
            columns: ["live_group_id"]
            isOneToOne: false
            referencedRelation: "live_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_group_sets: {
        Row: {
          created_at: string
          created_by_user_id: string
          grouping_method: string
          id: string
          live_session_id: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          grouping_method: string
          id?: string
          live_session_id: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          grouping_method?: string
          id?: string
          live_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_group_sets_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_group_sets_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_groups: {
        Row: {
          created_at: string
          group_name: string
          id: string
          live_group_set_id: string
        }
        Insert: {
          created_at?: string
          group_name: string
          id?: string
          live_group_set_id: string
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          live_group_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_groups_live_group_set_id_fkey"
            columns: ["live_group_set_id"]
            isOneToOne: false
            referencedRelation: "live_group_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      live_responses: {
        Row: {
          confidence: number | null
          id: string
          lesson_block_id: string
          live_session_id: string
          response_payload: Json
          submitted_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          id?: string
          lesson_block_id: string
          live_session_id: string
          response_payload?: Json
          submitted_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          id?: string
          lesson_block_id?: string
          live_session_id?: string
          response_payload?: Json
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_responses_lesson_block_id_fkey"
            columns: ["lesson_block_id"]
            isOneToOne: false
            referencedRelation: "lesson_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_responses_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          live_session_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_payload?: Json
          event_type: string
          id?: string
          live_session_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          live_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_events_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_participants: {
        Row: {
          display_name: string
          id: string
          join_kind: Database["public"]["Enums"]["participant_join_kind"]
          joined_at: string
          left_at: string | null
          live_session_id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          display_name: string
          id?: string
          join_kind: Database["public"]["Enums"]["participant_join_kind"]
          joined_at?: string
          left_at?: string | null
          live_session_id: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          display_name?: string
          id?: string
          join_kind?: Database["public"]["Enums"]["participant_join_kind"]
          joined_at?: string
          left_at?: string | null
          live_session_id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_session_participants_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_session_participants_session_org_fk"
            columns: ["live_session_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "live_session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          class_id: string
          ended_at: string | null
          host_teacher_id: string
          id: string
          lesson_version_id: string
          organization_id: string
          session_code: string
          started_at: string
        }
        Insert: {
          class_id: string
          ended_at?: string | null
          host_teacher_id: string
          id?: string
          lesson_version_id: string
          organization_id: string
          session_code: string
          started_at?: string
        }
        Update: {
          class_id?: string
          ended_at?: string | null
          host_teacher_id?: string
          id?: string
          lesson_version_id?: string
          organization_id?: string
          session_code?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_host_teacher_id_fkey"
            columns: ["host_teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_lesson_version_id_fkey"
            columns: ["lesson_version_id"]
            isOneToOne: false
            referencedRelation: "lesson_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          details: Json
          flag_reason: Database["public"]["Enums"]["moderation_reason"]
          id: string
          organization_id: string
          resolution_status: Database["public"]["Enums"]["moderation_resolution_status"]
          resolved_at: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["moderation_source_type"]
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          details?: Json
          flag_reason: Database["public"]["Enums"]["moderation_reason"]
          id?: string
          organization_id: string
          resolution_status?: Database["public"]["Enums"]["moderation_resolution_status"]
          resolved_at?: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["moderation_source_type"]
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          details?: Json
          flag_reason?: Database["public"]["Enums"]["moderation_reason"]
          id?: string
          organization_id?: string
          resolution_status?: Database["public"]["Enums"]["moderation_resolution_status"]
          resolved_at?: string | null
          source_id?: string
          source_type?: Database["public"]["Enums"]["moderation_source_type"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_flags_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_policy_settings: {
        Row: {
          allow_guest_live_join: boolean
          data_retention_days: number
          organization_id: string
          pii_filter_level: string
          updated_at: string
        }
        Insert: {
          allow_guest_live_join?: boolean
          data_retention_days?: number
          organization_id: string
          pii_filter_level?: string
          updated_at?: string
        }
        Update: {
          allow_guest_live_join?: boolean
          data_retention_days?: number
          organization_id?: string
          pii_filter_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_policy_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          email_domain: string | null
          id: string
          name: string
          tenant_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_domain?: string | null
          id?: string
          name: string
          tenant_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_domain?: string | null
          id?: string
          name?: string
          tenant_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          id: string
          role_key: Database["public"]["Enums"]["role_key"]
        }
        Insert: {
          created_at?: string
          id?: string
          role_key: Database["public"]["Enums"]["role_key"]
        }
        Update: {
          created_at?: string
          id?: string
          role_key?: Database["public"]["Enums"]["role_key"]
        }
        Relationships: []
      }
      rubric_scores: {
        Row: {
          context_ref_id: string
          context_type: string
          created_at: string
          created_by_user_id: string
          id: string
          rubric_id: string
          score_payload: Json
          user_id: string
        }
        Insert: {
          context_ref_id: string
          context_type: string
          created_at?: string
          created_by_user_id: string
          id?: string
          rubric_id: string
          score_payload?: Json
          user_id: string
        }
        Update: {
          context_ref_id?: string
          context_type?: string
          created_at?: string
          created_by_user_id?: string
          id?: string
          rubric_id?: string
          score_payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_scores_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_scores_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          created_at: string
          criteria: Json
          id: string
          organization_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          id?: string
          organization_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          id?: string
          organization_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      standards_tags: {
        Row: {
          code: string
          framework: string
          id: string
          label: string
        }
        Insert: {
          code: string
          framework: string
          id?: string
          label: string
        }
        Update: {
          code?: string
          framework?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_feedback: {
        Row: {
          context_ref_id: string
          context_type: string
          created_at: string
          created_by_user_id: string
          feedback_text: string
          id: string
          user_id: string
        }
        Insert: {
          context_ref_id: string
          context_type: string
          created_at?: string
          created_by_user_id: string
          feedback_text: string
          id?: string
          user_id: string
        }
        Update: {
          context_ref_id?: string
          context_type?: string
          created_at?: string
          created_by_user_id?: string
          feedback_text?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_feedback_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sequence_no: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sequence_no: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sequence_no?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role_key: Database["public"]["Enums"]["role_key"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role_key: Database["public"]["Enums"]["role_key"]
          user_id: string
        }
        Update: {
          created_at?: string
          role_key?: Database["public"]["Enums"]["role_key"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          is_active: boolean
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_app_user_id: { Args: never; Returns: string }
      get_user_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["role_key"]
          _user_id: string
        }
        Returns: boolean
      }
      join_class_by_code: { Args: { p_code: string }; Returns: Json }
      join_live_session_by_code: {
        Args: { p_code: string; p_display_name?: string }
        Returns: Json
      }
    }
    Enums: {
      assignment_target_type: "class" | "group" | "student"
      block_type:
        | "video"
        | "poll"
        | "mcq"
        | "multi_select"
        | "short_answer"
        | "scenario"
        | "dilemma_tree"
        | "drag_drop"
        | "matching"
        | "debate"
        | "group_board"
        | "collaborative_board"
        | "drawing"
        | "red_team"
        | "exit_ticket"
        | "concept_reveal"
        | "micro_challenge"
        | "reasoning_response"
        | "peer_compare"
        | "peer_review"
        | "group_challenge"
      enrollment_status: "active" | "invited" | "removed"
      moderation_reason: "pii" | "profanity" | "safety" | "other"
      moderation_resolution_status: "open" | "resolved" | "dismissed"
      moderation_source_type:
        | "live_response"
        | "independent_response"
        | "board_post"
      participant_join_kind: "account" | "guest"
      publish_status: "draft" | "published" | "archived"
      role_key:
        | "student"
        | "teacher"
        | "school_admin"
        | "ethics_admin"
        | "curriculum_admin"
      step_status: "locked" | "unlocked" | "completed" | "retry"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assignment_target_type: ["class", "group", "student"],
      block_type: [
        "video",
        "poll",
        "mcq",
        "multi_select",
        "short_answer",
        "scenario",
        "dilemma_tree",
        "drag_drop",
        "matching",
        "debate",
        "group_board",
        "collaborative_board",
        "drawing",
        "red_team",
        "exit_ticket",
        "concept_reveal",
        "micro_challenge",
        "reasoning_response",
        "peer_compare",
        "peer_review",
        "group_challenge",
      ],
      enrollment_status: ["active", "invited", "removed"],
      moderation_reason: ["pii", "profanity", "safety", "other"],
      moderation_resolution_status: ["open", "resolved", "dismissed"],
      moderation_source_type: [
        "live_response",
        "independent_response",
        "board_post",
      ],
      participant_join_kind: ["account", "guest"],
      publish_status: ["draft", "published", "archived"],
      role_key: [
        "student",
        "teacher",
        "school_admin",
        "ethics_admin",
        "curriculum_admin",
      ],
      step_status: ["locked", "unlocked", "completed", "retry"],
    },
  },
} as const
