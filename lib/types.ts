import { createContext } from 'react';

// --- Types generated from OpenAPI spec ---

// Auth
export interface AuthResponse {
  accessToken: string;
}

// Program
export interface CreateProgramRequest {
  faq: string;
  title?: string;
  description?: string;
  languagePrimary?: string;
  languagesAvailable?: string[];
}

export interface ProgramResponse {
  id?: string;
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived' | 'scheduled';
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

// Term
export interface CreateTermRequest {
  termNumber: number;
  title?: string;
}

export interface TermResponse {
  id?: string;
  termNumber?: number;
  title?: string;
}

// Lesson
export interface CreateLessonRequest {
  lessonNumber: number;
  title: string;
  contentType: 'video' | 'article';
  durationMs?: number;
  isPaid?: boolean;
  contentLanguagePrimary: string;
  contentLanguagesAvailable: string[];
  contentUrlsByLanguage: Record<string, string>;
}

export interface LessonResponse {
  id?: string;
  lessonNumber?: number;
  title?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  publishAt?: string;
  publishedAt?: string;
}

// Catalog
export interface LessonCatalogResponse {
  id: string;
  lessonNumber: number;
  title: string;
  isPaid: boolean;
  publishedAt: string;
}
export type CatalogLessonsResponse = LessonCatalogResponse[];

export interface ProgramCatalogResponse {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
}
export type CatalogProgramsResponse = ProgramCatalogResponse[];

export interface TermCatalogResponse {
  id: string;
  termNumber: number;
  title: string;
}
export type CatalogTermsResponse = TermCatalogResponse[];

// Scheduling
export interface ScheduleLessonRequest {
  publishAt: string;
}

// Asset
export interface PresignAssetRequest {
  assetType?: 'poster' | 'thumbnail' | 'subtitle';
  variant?: 'portrait' | 'landscape' | 'square' | 'banner';
  language?: string;
  fileName?: string;
  contentType?: string;
}

export interface PresignAssetResponse {
  uploadUrl?: string;
  publicUrl?: string;
}

export interface PresignResponse {
  url: string[];
}
