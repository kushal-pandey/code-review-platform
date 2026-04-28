export interface User {
  id: number;
  username: string;
  avatarUrl: string;
}

export interface Comment {
  id?: number;
  content: string;
  lineNumber?: number;
  author?: User;
  createdAt?: string;
  isAi?: boolean;
  sender?: string;
}

export interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  author: User;
  comments: Comment[];
}