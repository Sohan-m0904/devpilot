// frontend/lib/types.ts

export interface QueryTopItem {
  id?: string;
  snippet?: string;     // optional alias for content
  content?: string;     // the actual code text
  file_path?: string;   // file path in Supabase
  score: number;
}

export interface QueryResult {
  top: QueryTopItem[];
}


export type QueryResponse = {
  ok: boolean;
  top: QueryTopItem[];
};

export type EmbedResponse = {
  ok: boolean;
  total: number;
  success: number;
};

export type UploadResult = {
  message: string;
  folder: string;
  projectId?: string; // if your backend returns it later
};
export interface QueryResult {
  top: QueryTopItem[];
}

