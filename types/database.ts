export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Mood = 'happy' | 'romantic' | 'adventurous' | 'nostalgic' | 'silly' | 'bittersweet'

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface Relationship {
  id: string
  name: string
  started_at: string
  created_by: string | null
  created_at: string
}

export interface RelationshipMember {
  relationship_id: string
  user_id: string
  joined_at: string
}

export interface Memory {
  id: string
  relationship_id: string
  title: string
  description: string | null
  memory_date: string
  location_name: string | null
  latitude: number | null
  longitude: number | null
  song_title: string | null
  song_artist: string | null
  song_url: string | null
  mood: Mood | null
  is_favorite: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MemoryMedia {
  id: string
  memory_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number | null
  width: number | null
  height: number | null
  is_cover: boolean
  sort_order: number
  created_at: string
}

export interface Tag {
  id: string
  relationship_id: string
  name: string
  color: string
}

export interface MemoryTagMap {
  memory_id: string
  tag_id: string
}

export interface Milestone {
  id: string
  relationship_id: string
  title: string
  description: string | null
  milestone_date: string
  icon: string
  photo_path: string | null
  location_name: string | null
  created_at: string
}

export interface InviteToken {
  token: string
  relationship_id: string
  created_by: string
  expires_at: string
  used_at: string | null
}

export interface RelationshipSettings {
  relationship_id: string
  theme: string
  cover_photo_path: string | null
  updated_at: string
}

export interface MemoryWithMedia extends Memory {
  memory_media?: MemoryMedia[]
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      relationships: {
        Row: Relationship
        Insert: Omit<Relationship, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Relationship, 'id'>>
      }
      relationship_members: {
        Row: RelationshipMember
        Insert: Omit<RelationshipMember, 'joined_at'> & { joined_at?: string }
        Update: Partial<Omit<RelationshipMember, 'relationship_id' | 'user_id'>>
      }
      memories: {
        Row: Memory
        Insert: Omit<Memory, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Memory, 'id'>>
      }
      memory_media: {
        Row: MemoryMedia
        Insert: Omit<MemoryMedia, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<MemoryMedia, 'id'>>
      }
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id'> & { id?: string }
        Update: Partial<Omit<Tag, 'id'>>
      }
      memory_tag_map: {
        Row: MemoryTagMap
        Insert: MemoryTagMap
        Update: Partial<MemoryTagMap>
      }
      milestones: {
        Row: Milestone
        Insert: Omit<Milestone, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Milestone, 'id'>>
      }
      invite_tokens: {
        Row: InviteToken
        Insert: Omit<InviteToken, 'token'> & { token?: string }
        Update: Partial<Omit<InviteToken, 'token'>>
      }
      relationship_settings: {
        Row: RelationshipSettings
        Insert: Omit<RelationshipSettings, 'updated_at'> & { updated_at?: string }
        Update: Partial<Omit<RelationshipSettings, 'relationship_id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      my_relationship_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
