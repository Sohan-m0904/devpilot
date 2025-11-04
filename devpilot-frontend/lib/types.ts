export type QueryTopItem = {
  snippet_id: string;
  snippet: string;
  score: number;
};

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
