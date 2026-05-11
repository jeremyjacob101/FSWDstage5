export type MiddlewareRequest = {
  method: string;
  path?: string;
  query: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers: Record<string, unknown>;
  app?: {
    db?: {
      get: (name: string) => {
        value: () => {
          id?: number;
          userId?: number;
          albumId?: number;
          email?: string;
          name?: string;
          postId?: number;
          [key: string]: unknown;
        }[];
      };
    };
  };
};

export type MiddlewareResponse = {
  status: (code: number) => {
    json: (body: { message: string }) => void;
  };
};
