import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { AdminSession, AdminUser, AppSetting, AppSettingUpdate } from '../types';
import { getSupabaseBrowserClient } from './supabase';

const DEFAULT_PUBLIC_SITE_ORIGIN = 'https://grafgooseman.github.io';

const normalizeBaseUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
};

const normalizeAbsoluteUrl = (value: string) => {
  const url = new URL(value);
  url.pathname = normalizeBaseUrl(url.pathname);
  url.search = '';
  url.hash = '';
  return url.toString();
};

export const resolveAdminAuthRedirectUrl = (options?: {
  siteUrl?: string;
  baseUrl?: string;
  defaultOrigin?: string;
}) => {
  const siteUrl = options?.siteUrl ?? import.meta.env.VITE_PUBLIC_SITE_URL;
  if (siteUrl) {
    return normalizeAbsoluteUrl(siteUrl);
  }

  const baseUrl = options?.baseUrl ?? import.meta.env.BASE_URL;
  const defaultOrigin = options?.defaultOrigin ?? DEFAULT_PUBLIC_SITE_ORIGIN;
  return new URL(normalizeBaseUrl(baseUrl), normalizeAbsoluteUrl(defaultOrigin)).toString();
};

type AppSettingRow = {
  key: AppSetting['key'];
  group_key: string;
  label: string;
  help_text: string;
  rationale: string;
  source_note: string | null;
  value_type: AppSetting['valueType'];
  text_value: string | null;
  numeric_value: string | number | null;
  unit: string;
  decimals: number;
  sort_order: number;
  is_public: boolean;
  editable_by_admin: boolean;
  updated_at: string;
  updated_by: string | null;
};

type AdminUserRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  is_active: boolean;
  created_from_code_id: number | null;
};

const APP_SETTINGS_SELECT = [
  'key',
  'group_key',
  'label',
  'help_text',
  'rationale',
  'source_note',
  'value_type',
  'text_value',
  'numeric_value',
  'unit',
  'decimals',
  'sort_order',
  'is_public',
  'editable_by_admin',
  'updated_at',
  'updated_by',
].join(', ');

const APP_ADMIN_USERS_SELECT = [
  'user_id',
  'email',
  'display_name',
  'created_at',
  'is_active',
  'created_from_code_id',
].join(', ');

const toAppSetting = (row: AppSettingRow): AppSetting => ({
  key: row.key,
  groupKey: row.group_key,
  label: row.label,
  helpText: row.help_text,
  rationale: row.rationale,
  sourceNote: row.source_note,
  valueType: row.value_type,
  textValue: row.text_value,
  numericValue: row.numeric_value === null ? null : Number(row.numeric_value),
  unit: row.unit,
  decimals: row.decimals,
  sortOrder: row.sort_order,
  isPublic: row.is_public,
  editableByAdmin: row.editable_by_admin,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
});

const toAdminUser = (row: AdminUserRow): AdminUser => ({
  userId: row.user_id,
  email: row.email,
  displayName: row.display_name,
  createdAt: row.created_at,
  isActive: row.is_active,
  createdFromCodeId: row.created_from_code_id,
});

const isNoRowsError = (error: { code?: string } | null) => error?.code === 'PGRST116';

export const fetchPublicSettings = async () => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select(APP_SETTINGS_SELECT)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as AppSettingRow[]).map(toAppSetting);
};

export const fetchAdminSession = async (): Promise<AdminSession> => {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.user) {
    return {
      authEmail: null,
      adminUser: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    return {
      authEmail: null,
      adminUser: null,
    };
  }

  const { data, error } = await supabase
    .from('app_admin_users')
    .select(APP_ADMIN_USERS_SELECT)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error && !isNoRowsError(error)) {
    throw new Error(error.message);
  }

  return {
    authEmail: user.email ?? null,
    adminUser: data ? toAdminUser(data as unknown as AdminUserRow) : null,
  };
};

export const subscribeToAuthChanges = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) => {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return () => subscription.unsubscribe();
};

export const signInAdmin = async (email: string, password: string) => {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const signUpAdmin = async (input: {
  displayName: string;
  email: string;
  password: string;
  code: string;
}) => {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: resolveAdminAuthRedirectUrl(),
      data: {
        signup_kind: 'admin',
        admin_signup_code: input.code,
        display_name: input.displayName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const signOutAdmin = async () => {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};

export const clearLocalAdminSession = async () => {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut({ scope: 'local' });

  if (error) {
    throw new Error(error.message);
  }
};

export const updateAppSettings = async (updates: AppSettingUpdate[]) => {
  const supabase = getSupabaseBrowserClient();

  for (const update of updates) {
    const payload = {
      label: update.label,
      help_text: update.helpText,
      rationale: update.rationale,
      source_note: update.sourceNote,
      text_value: update.textValue,
      numeric_value: update.numericValue,
    };

    const { error } = await supabase.from('app_settings').update(payload).eq('key', update.key);
    if (error) {
      throw new Error(error.message);
    }
  }

  return fetchPublicSettings();
};
