export type ProfileRow = {
  wallet_address: string;
  display_name: string | null;
  bio: string | null;
  created_at: string;
};

export type PostRow = {
  id: string;
  author_address: string;
  body: string;
  created_at: string;
};

export type FollowRow = {
  follower_address: string;
  following_address: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          wallet_address: string;
          display_name?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          wallet_address?: string;
          display_name?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: PostRow;
        Insert: {
          id?: string;
          author_address: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_address?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: FollowRow;
        Insert: {
          follower_address: string;
          following_address: string;
          created_at?: string;
        };
        Update: {
          follower_address?: string;
          following_address?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type FeedPost = PostRow & {
  author: Pick<ProfileRow, "wallet_address" | "display_name">;
};

export type SuggestedTrader = ProfileRow & {
  is_following: boolean;
};

export type ProfileDetail = ProfileRow & {
  follower_count: number;
  following_count: number;
  post_count: number;
  is_following: boolean;
  is_owner: boolean;
};

export type ProfilePost = PostRow & {
  author: Pick<ProfileRow, "wallet_address" | "display_name">;
};
