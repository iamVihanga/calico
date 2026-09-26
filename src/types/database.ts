export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string;
          id: number;
          ok: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          ok: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          ok?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          abandon_reason: string | null;
          ai_extracted: boolean;
          author: string | null;
          author_native: string | null;
          current_page: number;
          format: Database['public']['Enums']['book_format'];
          isbn: string | null;
          item_id: string;
          language: string;
          ownership: string;
          progress_unit: string;
          published_year: number | null;
          publisher: string | null;
          total_pages: number | null;
          user_id: string;
          wishlist_price_lkr: number | null;
          wishlist_priority: string | null;
          wishlist_where: string | null;
        };
        Insert: {
          abandon_reason?: string | null;
          ai_extracted?: boolean;
          author?: string | null;
          author_native?: string | null;
          current_page?: number;
          format?: Database['public']['Enums']['book_format'];
          isbn?: string | null;
          item_id: string;
          language?: string;
          ownership?: string;
          progress_unit?: string;
          published_year?: number | null;
          publisher?: string | null;
          total_pages?: number | null;
          user_id?: string;
          wishlist_price_lkr?: number | null;
          wishlist_priority?: string | null;
          wishlist_where?: string | null;
        };
        Update: {
          abandon_reason?: string | null;
          ai_extracted?: boolean;
          author?: string | null;
          author_native?: string | null;
          current_page?: number;
          format?: Database['public']['Enums']['book_format'];
          isbn?: string | null;
          item_id?: string;
          language?: string;
          ownership?: string;
          progress_unit?: string;
          published_year?: number | null;
          publisher?: string | null;
          total_pages?: number | null;
          user_id?: string;
          wishlist_price_lkr?: number | null;
          wishlist_priority?: string | null;
          wishlist_where?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'books_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      collection_items: {
        Row: {
          added_at: string;
          collection_id: string;
          item_id: string;
          position: string;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          collection_id: string;
          item_id: string;
          position: string;
          user_id?: string;
        };
        Update: {
          added_at?: string;
          collection_id?: string;
          item_id?: string;
          position?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_items_collection_id_user_id_fkey';
            columns: ['collection_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'collections';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'collection_items_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      collections: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          pinned: boolean;
          position: string;
          sort_mode: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          pinned?: boolean;
          position: string;
          sort_mode?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          pinned?: boolean;
          position?: string;
          sort_mode?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      episode_watches: {
        Row: {
          episode: number;
          item_id: string;
          season: number;
          user_id: string;
          watched_at: string;
        };
        Insert: {
          episode: number;
          item_id: string;
          season: number;
          user_id?: string;
          watched_at?: string;
        };
        Update: {
          episode?: number;
          item_id?: string;
          season?: number;
          user_id?: string;
          watched_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'episode_watches_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      items: {
        Row: {
          backdrop_path: string | null;
          cover_path: string | null;
          cover_url: string | null;
          created_at: string;
          finished_at: string | null;
          id: string;
          kind: Database['public']['Enums']['media_kind'];
          note: string | null;
          poster_path: string | null;
          rating: number | null;
          started_at: string | null;
          status: Database['public']['Enums']['item_status'];
          title: string;
          title_native: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          backdrop_path?: string | null;
          cover_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          kind: Database['public']['Enums']['media_kind'];
          note?: string | null;
          poster_path?: string | null;
          rating?: number | null;
          started_at?: string | null;
          status: Database['public']['Enums']['item_status'];
          title: string;
          title_native?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          backdrop_path?: string | null;
          cover_path?: string | null;
          cover_url?: string | null;
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          kind?: Database['public']['Enums']['media_kind'];
          note?: string | null;
          poster_path?: string | null;
          rating?: number | null;
          started_at?: string | null;
          status?: Database['public']['Enums']['item_status'];
          title?: string;
          title_native?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      loans: {
        Row: {
          borrowed_on: string;
          created_at: string;
          direction: Database['public']['Enums']['loan_direction'];
          due_on: string | null;
          due_stamps: string[];
          id: string;
          item_id: string;
          party: string;
          renewal_count: number;
          returned_on: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          borrowed_on?: string;
          created_at?: string;
          direction?: Database['public']['Enums']['loan_direction'];
          due_on?: string | null;
          due_stamps?: string[];
          id?: string;
          item_id: string;
          party: string;
          renewal_count?: number;
          returned_on?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          borrowed_on?: string;
          created_at?: string;
          direction?: Database['public']['Enums']['loan_direction'];
          due_on?: string | null;
          due_stamps?: string[];
          id?: string;
          item_id?: string;
          party?: string;
          renewal_count?: number;
          returned_on?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loans_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      movies: {
        Row: {
          genres: string[];
          item_id: string;
          overview: string | null;
          release_year: number | null;
          runtime_min: number | null;
          tmdb_collection_id: number | null;
          tmdb_collection_name: string | null;
          tmdb_id: number;
          user_id: string;
        };
        Insert: {
          genres?: string[];
          item_id: string;
          overview?: string | null;
          release_year?: number | null;
          runtime_min?: number | null;
          tmdb_collection_id?: number | null;
          tmdb_collection_name?: string | null;
          tmdb_id: number;
          user_id?: string;
        };
        Update: {
          genres?: string[];
          item_id?: string;
          overview?: string | null;
          release_year?: number | null;
          runtime_min?: number | null;
          tmdb_collection_id?: number | null;
          tmdb_collection_name?: string | null;
          tmdb_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'movies_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      page_logs: {
        Row: {
          id: string;
          item_id: string;
          logged_at: string;
          page: number;
          user_id: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          logged_at?: string;
          page: number;
          user_id?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          logged_at?: string;
          page?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'page_logs_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          default_library: string | null;
          default_loan_days: number;
          display_name: string | null;
          id: string;
          include_specials: boolean;
          lead_script: string;
          reading_goal: number | null;
          remind_1d: boolean;
          remind_3d: boolean;
          reminder_time: string;
          theme: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          default_library?: string | null;
          default_loan_days?: number;
          display_name?: string | null;
          id: string;
          include_specials?: boolean;
          lead_script?: string;
          reading_goal?: number | null;
          remind_1d?: boolean;
          remind_3d?: boolean;
          reminder_time?: string;
          theme?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          default_library?: string | null;
          default_loan_days?: number;
          display_name?: string | null;
          id?: string;
          include_specials?: boolean;
          lead_script?: string;
          reading_goal?: number | null;
          remind_1d?: boolean;
          remind_3d?: boolean;
          reminder_time?: string;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reading_sessions: {
        Row: {
          created_at: string;
          finished_at: string | null;
          id: string;
          item_id: string;
          note: string | null;
          outcome: string;
          rating: number | null;
          started_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          item_id: string;
          note?: string | null;
          outcome?: string;
          rating?: number | null;
          started_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          item_id?: string;
          note?: string | null;
          outcome?: string;
          rating?: number | null;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reading_sessions_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      shows: {
        Row: {
          first_air_year: number | null;
          item_id: string;
          last_synced_at: string | null;
          network: string | null;
          next_air_date: string | null;
          next_episode: number | null;
          next_season: number | null;
          number_of_seasons: number | null;
          overview: string | null;
          tmdb_id: number;
          tmdb_status: string | null;
          user_id: string;
        };
        Insert: {
          first_air_year?: number | null;
          item_id: string;
          last_synced_at?: string | null;
          network?: string | null;
          next_air_date?: string | null;
          next_episode?: number | null;
          next_season?: number | null;
          number_of_seasons?: number | null;
          overview?: string | null;
          tmdb_id: number;
          tmdb_status?: string | null;
          user_id?: string;
        };
        Update: {
          first_air_year?: number | null;
          item_id?: string;
          last_synced_at?: string | null;
          network?: string | null;
          next_air_date?: string | null;
          next_episode?: number | null;
          next_season?: number | null;
          number_of_seasons?: number | null;
          overview?: string | null;
          tmdb_id?: number;
          tmdb_status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shows_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      tmdb_episodes: {
        Row: {
          air_date: string | null;
          episode: number;
          fetched_at: string;
          name: string | null;
          runtime_min: number | null;
          season: number;
          still_path: string | null;
          tmdb_show_id: number;
          vote_average: number | null;
        };
        Insert: {
          air_date?: string | null;
          episode: number;
          fetched_at?: string;
          name?: string | null;
          runtime_min?: number | null;
          season: number;
          still_path?: string | null;
          tmdb_show_id: number;
          vote_average?: number | null;
        };
        Update: {
          air_date?: string | null;
          episode?: number;
          fetched_at?: string;
          name?: string | null;
          runtime_min?: number | null;
          season?: number;
          still_path?: string | null;
          tmdb_show_id?: number;
          vote_average?: number | null;
        };
        Relationships: [];
      };
      up_next: {
        Row: {
          added_at: string;
          item_id: string;
          position: string;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          item_id: string;
          position: string;
          user_id?: string;
        };
        Update: {
          added_at?: string;
          item_id?: string;
          position?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'up_next_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      watch_logs: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          note: string | null;
          rating: number | null;
          user_id: string;
          watched_on: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          note?: string | null;
          rating?: number | null;
          user_id?: string;
          watched_on?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          note?: string | null;
          rating?: number | null;
          user_id?: string;
          watched_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'watch_logs_item_id_user_id_fkey';
            columns: ['item_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_loan: { Args: { p: Json }; Returns: string };
      add_tmdb_item: { Args: { p: Json }; Returns: string };
      add_to_collection: {
        Args: { p_collection: string; p_items: string[]; p_positions: string[] };
        Returns: undefined;
      };
      create_collection: {
        Args: {
          p_description?: string;
          p_id: string;
          p_items?: string[];
          p_name: string;
          p_position: string;
          p_positions?: string[];
        };
        Returns: string;
      };
      create_book: { Args: { p: Json }; Returns: string };
      export_my_data: { Args: Record<PropertyKey, never>; Returns: Json };
      finish_book: {
        Args: {
          p_item: string;
          p_note: string;
          p_on: string;
          p_rating: number;
          p_return_loan: boolean;
        };
        Returns: undefined;
      };
      home_stats: { Args: Record<PropertyKey, never>; Returns: Json };
      local_today: { Args: Record<PropertyKey, never>; Returns: string };
      log_page: {
        Args: { p_item: string; p_log_id: string; p_page: number };
        Returns: undefined;
      };
      log_viewing: {
        Args: {
          p_id: string;
          p_item: string;
          p_note: string;
          p_on: string;
          p_rating: number;
        };
        Returns: undefined;
      };
      mark_episodes: {
        Args: {
          p_episodes: number[];
          p_item: string;
          p_season: number;
          p_watched: boolean;
        };
        Returns: undefined;
      };
      mark_season: {
        Args: { p_item: string; p_season: number };
        Returns: undefined;
      };
      pages_read_between: {
        Args: { p_from: string; p_to: string };
        Returns: number;
      };
      renew_loan: {
        Args: { p_loan: string; p_new_due: string };
        Returns: undefined;
      };
      reopen_loan: {
        Args: { p_loan: string; p_ownership?: string };
        Returns: undefined;
      };
      return_loan: {
        Args: { p_loan: string; p_on: string };
        Returns: undefined;
      };
      search_library: {
        Args: { q: string };
        Returns: {
          author: string;
          item_id: string;
          kind: Database['public']['Enums']['media_kind'];
          score: number;
          status: Database['public']['Enums']['item_status'];
          title: string;
          title_native: string;
        }[];
      };
      set_book_status: {
        Args: {
          p_item: string;
          p_on?: string;
          p_status: Database['public']['Enums']['item_status'];
        };
        Returns: undefined;
      };
      set_item_status: {
        Args: {
          p_item: string;
          p_on?: string;
          p_status: Database['public']['Enums']['item_status'];
        };
        Returns: undefined;
      };
      show_progress: {
        Args: { p_item?: string };
        Returns: {
          aired: number;
          caught_up: boolean;
          item_id: string;
          next_air_date: string;
          next_episode: number;
          next_name: string;
          next_season: number;
          next_still: string;
          tmdb_status: string;
          total: number;
          watched: number;
        }[];
      };
      stop_book: {
        Args: { p_item: string; p_reason: string; p_to_read: boolean };
        Returns: undefined;
      };
      update_book: {
        Args: { p_item: string; p: Json };
        Returns: undefined;
      };
      year_stats: { Args: { p_year: number }; Returns: Json };
    };
    Enums: {
      book_format: 'physical' | 'ebook' | 'audiobook';
      item_status:
        'wishlist' | 'to_read' | 'reading' | 'read' | 'abandoned' | 'watchlist' | 'watching' | 'watched' | 'dropped';
      loan_direction: 'borrowed' | 'lent';
      media_kind: 'book' | 'movie' | 'show';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      book_format: ['physical', 'ebook', 'audiobook'],
      item_status: [
        'wishlist',
        'to_read',
        'reading',
        'read',
        'abandoned',
        'watchlist',
        'watching',
        'watched',
        'dropped',
      ],
      loan_direction: ['borrowed', 'lent'],
      media_kind: ['book', 'movie', 'show'],
    },
  },
} as const;
