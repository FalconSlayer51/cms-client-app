const API_BASE_URL = "https://cms-app-backend-k09y.onrender.com";

type RequestOptions = {
  token?: string;
  query?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined>
) {
  if (!query) return `${API_BASE_URL}${path}`;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
  return params ? `${API_BASE_URL}${path}?${params}` : `${API_BASE_URL}${path}`;
}

async function apiFetch<T>(
  path: string,
  method: string,
  body?: unknown,
  opts: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const url = buildUrl(path, opts.query);
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let errorMsg = `API Error: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      errorMsg = err.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  if (res.status === 204 || res.status === 202) return undefined as T;
  return res.json();
}

// --- Auth ---
import type { AuthResponse } from "./types";
export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", "POST", data);
}

export async function signupUser(data: {
  email: string;
  password: string;
  role: string;
}): Promise<void> {
  return apiFetch<void>("/auth/signup", "POST", data);
}

// --- Programs (CMS) ---
import type { CreateProgramRequest, ProgramResponse } from "./types";
export async function getPrograms(token: string): Promise<ProgramResponse[]> {
  return apiFetch<ProgramResponse[]>("/cms/programs", "GET", undefined, {
    token,
  });
}
export async function createProgram(
  data: CreateProgramRequest,
  token: string
): Promise<ProgramResponse> {
  return apiFetch<ProgramResponse>("/cms/programs", "POST", data, { token });
}
export async function updateProgram(
  id: string,
  data: CreateProgramRequest,
  token: string
): Promise<ProgramResponse> {
  return apiFetch<ProgramResponse>(`/cms/programs/${id}`, "PUT", data, {
    token,
  });
}
export async function publishProgram(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/cms/programs/${id}/publish`, "POST", undefined, {
    token,
  });
}
export async function scheduleProgram(
  id: string,
  publishAt: string,
  token: string
): Promise<void> {
  return apiFetch<void>(`/cms/programs/${id}/schedule`, "POST", undefined, {
    token,
    query: { publishAt },
  });
}

// --- Terms (CMS) ---
import type { CreateTermRequest, TermResponse } from "./types";
export async function getTerms(
  programId: string,
  token: string
): Promise<TermResponse[]> {
  return apiFetch<TermResponse[]>(
    `/cms/programs/${programId}/terms`,
    "GET",
    undefined,
    { token }
  );
}
export async function createTerm(
  programId: string,
  data: CreateTermRequest,
  token: string
): Promise<TermResponse> {
  return apiFetch<TermResponse>(
    `/cms/programs/${programId}/terms`,
    "POST",
    data,
    { token }
  );
}
export async function updateTerm(
  termId: string,
  data: CreateTermRequest,
  token: string
): Promise<TermResponse> {
  return apiFetch<TermResponse>(`/cms/terms/${termId}`, "PUT", data, { token });
}

// --- Lessons (CMS) ---
import type {
  CreateLessonRequest,
  LessonResponse,
  ScheduleLessonRequest,
} from "./types";
export async function getLessons(
  termId: string,
  token: string
): Promise<LessonResponse[]> {
  return apiFetch<LessonResponse[]>(
    `/cms/terms/${termId}/lessons`,
    "GET",
    undefined,
    { token }
  );
}
export async function createLesson(
  termId: string,
  data: CreateLessonRequest,
  token: string
): Promise<LessonResponse> {
  return apiFetch<LessonResponse>(
    `/cms/terms/${termId}/lessons`,
    "POST",
    data,
    { token }
  );
}
export async function scheduleLesson(
  lessonId: string,
  data: ScheduleLessonRequest,
  token: string
): Promise<void> {
  return apiFetch<void>(`/cms/lessons/${lessonId}/schedule`, "POST", data, {
    token,
  });
}

// --- Assets (CMS) ---
import type {
  PresignAssetRequest,
  PresignAssetResponse,
  PresignResponse,
} from "./types";
export async function presignProgramAsset(
  programId: string,
  data: PresignAssetRequest,
  token: string
): Promise<PresignAssetResponse> {
  return apiFetch<PresignAssetResponse>(
    `/cms/assets/presign/program/${programId}`,
    "POST",
    data,
    { token }
  );
}
export async function presignLessonAsset(
  lessonId: string,
  data: PresignAssetRequest,
  token: string
): Promise<PresignAssetResponse> {
  return apiFetch<PresignAssetResponse>(
    `/cms/assets/presign/lesson/${lessonId}`,
    "POST",
    data,
    { token }
  );
}
export async function getProgramAssets(
  programId: string
): Promise<PresignResponse> {
  return apiFetch<PresignResponse>(`/cms/assets/program/${programId}`, "GET");
}
export async function getLessonAssets(
  lessonId: string
): Promise<PresignResponse> {
  return apiFetch<PresignResponse>(`/cms/assets/lesson/${lessonId}`, "GET");
}

// --- Catalog (public) ---
import type {
  CatalogProgramsResponse,
  ProgramCatalogResponse,
  CatalogTermsResponse,
  TermCatalogResponse,
  CatalogLessonsResponse,
  LessonCatalogResponse,
} from "./types";
export async function getCatalogPrograms(): Promise<CatalogProgramsResponse> {
  return apiFetch<CatalogProgramsResponse>("/catalog/programs", "GET");
}
export async function getCatalogProgram(
  id: string
): Promise<ProgramCatalogResponse> {
  return apiFetch<ProgramCatalogResponse>(`/catalog/programs/${id}`, "GET");
}
export async function getCatalogProgramTerms(
  programId: string
): Promise<CatalogTermsResponse> {
  return apiFetch<CatalogTermsResponse>(
    `/catalog/programs/${programId}/terms`,
    "GET"
  );
}
export async function getCatalogTermLessons(
  termId: string
): Promise<CatalogLessonsResponse> {
  return apiFetch<CatalogLessonsResponse>(
    `/catalog/terms/${termId}/lessons`,
    "GET"
  );
}
