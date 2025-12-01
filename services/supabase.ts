/**
 * Supabase Client Configuration
 * Quản lý kết nối đến Supabase database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely get env vars
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
  } catch (e) {
    // Ignore error
  }
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
  } catch (e) {
    // Ignore error
  }

  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';
};

/**
 * Check if Admin/Service Role is configured
 */
export const isAdminConfigured = () => {
  return isSupabaseConfigured() && !!supabaseServiceRoleKey && supabaseServiceRoleKey !== 'YOUR_SERVICE_ROLE_KEY_HERE';
};

if (!isSupabaseConfigured()) {
  
} else {
  
  if (isAdminConfigured()) {
    
  } else {
    
  }
}

// Create Supabase client
export const supabase: SupabaseClient = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false },
    });

// Admin Supabase client với Service Role Key (bypass RLS)
export const supabaseAdmin: SupabaseClient = isAdminConfigured()
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : supabase; // Fallback to regular client if no service role key

// Supabase types
export interface UserSession {
  id: string;
  username: string;
  session_id: string;
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface BlockedUser {
  id: string;
  username: string;
  reason?: string;
  blocked_by?: string;
  blocked_at: string;
}

export interface SupabaseLoginActivity {
  id: string;
  username: string;
  student_name?: string;
  class_name?: string;
  department?: string;
  ip_address?: string;
  device?: string;
  browser?: string;
  user_agent?: string;
  device_fingerprint?: string;
  session_id?: string;
  login_at: string;
}

export interface SupabaseUserProfile {
  id: string;
  username: string;
  student_id?: number;
  student_code?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  class_name?: string;
  department?: string;
  birthday?: string;
  gender?: string;
  khoadaotao?: string;
  role: string;
  cached_at: string;
}

// Database operations
export const db = {
  supabase,

  async createSession(data: Omit<UserSession, 'id' | 'created_at' | 'is_active'>): Promise<UserSession | null> {
    if (!isSupabaseConfigured()) {
      
      return null;
    }

    try {
      const { data: session, error } = await supabase
        .from('user_sessions')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return session;
    } catch (error) {
      
      return null;
    }
  },

  async invalidateAllUserSessions(username: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      
      return true;
    }

    try {
      
      const { data, error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('username', username)
        .select();
      
      if (error) {
        
        return false;
      }
      
      
      return true;
    } catch (error) {
      
      return false;
    }
  },

  async checkSessionValidity(username: string, sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        
        return true;
      }

      if (!sessions || sessions.length === 0) {
        
        return true;
      }

      const activeSession = sessions[0];
      if (activeSession.session_id === sessionId) {
        
        return true;
      } else {
        
        return false;
      }
    } catch (error) {
      
      return true;
    }
  },

  async isUserBlocked(username: string): Promise<{ blocked: boolean; reason?: string }> {
    if (!isSupabaseConfigured()) {
      
      return { blocked: false };
    }

    try {
      // Normalize username to lowercase for comparison
      const normalizedUsername = username.toLowerCase();
      
      
      const { data, error } = await supabase
        .from('blocked_users')
        .select('reason, username')
        .ilike('username', normalizedUsername)
        .maybeSingle();
      
      if (error) {
        
        return { blocked: false };
      }
      
      if (!data) {
        
        return { blocked: false };
      }
      
      
      return { blocked: true, reason: data.reason };
    } catch (error) {
      
      return { blocked: false };
    }
  },

  async blockUser(username: string, reason: string, blockedBy: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      
      return true;
    }

    try {
      // Normalize username to lowercase
      const normalizedUsername = username.toLowerCase();
      
      
      const { error } = await supabase
        .from('blocked_users')
        .insert({ 
          username: normalizedUsername, 
          reason, 
          blocked_by: blockedBy,
          blocked_at: new Date().toISOString()
        });
      
      if (error) {
        
        return false;
      }
      
      
      return true;
    } catch (error) {
      
      return false;
    }
  },

  async unblockUser(username: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      
      return true;
    }

    try {
      // Normalize username to lowercase
      const normalizedUsername = username.toLowerCase();
      
      
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .ilike('username', normalizedUsername);
      
      if (error) {
        
        return false;
      }
      
      
      return true;
    } catch (error) {
      
      return false;
    }
  },

  async logLoginActivity(data: Partial<SupabaseLoginActivity>): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      
      return true;
    }

    try {
      const insertData: any = {
        login_at: new Date().toISOString()
      };
      
      if (data.username) insertData.username = data.username;
      if (data.student_name) insertData.student_name = data.student_name;
      if (data.class_name) insertData.class_name = data.class_name;
      if (data.department) insertData.department = data.department;
      if (data.ip_address) insertData.ip_address = data.ip_address;
      if (data.device) insertData.device = data.device;
      if (data.browser) insertData.browser = data.browser;
      if (data.user_agent) insertData.user_agent = data.user_agent;
      if (data.device_fingerprint) insertData.device_fingerprint = data.device_fingerprint;
      if (data.session_id) insertData.session_id = data.session_id;
      
      const { error } = await supabase.from('login_activities').insert(insertData);
      
      if (error) {
        
        return false;
      }
      return true;
    } catch (error) {
      
      return false;
    }
  },

  async cacheUserProfile(data: Partial<SupabaseUserProfile>): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      
      return true;
    }

    try {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', data.username)
        .maybeSingle();

      if (existing) {
        const updateData: any = {
          cached_at: new Date().toISOString()
        };
        
        if (data.student_id !== undefined) updateData.student_id = data.student_id;
        if (data.student_code) updateData.student_code = data.student_code;
        if (data.full_name) updateData.full_name = data.full_name;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;
        if (data.class_name) updateData.class_name = data.class_name;
        if (data.department) updateData.department = data.department;
        if (data.birthday) updateData.birthday = data.birthday;
        if (data.gender) updateData.gender = data.gender;
        if (data.khoadaotao) updateData.khoadaotao = data.khoadaotao;
        if (data.role) updateData.role = data.role;
        
        const { error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', existing.id);
        
        if (error) {
          
          return false;
        }
        return true;
      } else {
        const insertData: any = {
          username: data.username,
          cached_at: new Date().toISOString()
        };
        
        if (data.student_id !== undefined) insertData.student_id = data.student_id;
        if (data.student_code) insertData.student_code = data.student_code;
        if (data.full_name) insertData.full_name = data.full_name;
        if (data.email) insertData.email = data.email;
        if (data.phone) insertData.phone = data.phone;
        if (data.class_name) insertData.class_name = data.class_name;
        if (data.department) insertData.department = data.department;
        if (data.birthday) insertData.birthday = data.birthday;
        if (data.gender) insertData.gender = data.gender;
        if (data.khoadaotao) insertData.khoadaotao = data.khoadaotao;
        if (data.role) insertData.role = data.role;
        
        const { error } = await supabase.from('user_profiles').insert(insertData);
        if (error) {
          
          return false;
        }
        return true;
      }
    } catch {
      return false;
    }
  },

  async getAllUsers(): Promise<SupabaseUserProfile[]> {
    if (!isSupabaseConfigured()) {
      
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('cached_at', { ascending: false });
      if (error) return [];
      return data as SupabaseUserProfile[];
    } catch {
      return [];
    }
  },

  async getBlockedUsers(): Promise<BlockedUser[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase.from('blocked_users').select('*');
      if (error) return [];
      return data as BlockedUser[];
    } catch {
      return [];
    }
  },

  async cacheTestResult(result: {
    username: string;
    student_id: number;
    class_id: number;
    class_name?: string;
    week: number;
    test_id: number;
    score: number;
    total_score?: number;
    time_spent?: number;
    passed: number;
    submit_at: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('cached_test_results')
        .upsert({
          username: result.username,
          student_id: result.student_id,
          class_id: result.class_id,
          class_name: result.class_name,
          week: result.week,
          test_id: result.test_id,
          score: result.score,
          total_score: result.total_score,
          time_spent: result.time_spent,
          passed: result.passed,
          submit_at: result.submit_at,
        }, {
          onConflict: 'username,test_id'
        });
      
      return !error;
    } catch (error) {
      
      return false;
    }
  },

  async getAcademicStats(username: string): Promise<{
    gpa: number;
    totalTests: number;
    passRate: number;
    recentGrades: Array<{ subject: string; score: number; week: number }>;
  }> {
    if (!isSupabaseConfigured()) {
      return { gpa: 0, totalTests: 0, passRate: 0, recentGrades: [] };
    }

    try {
      const { data: stats } = await supabase
        .from('user_academic_stats')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      const { data: grades } = await supabase
        .from('cached_test_results')
        .select('class_name, score, week, submit_at')
        .eq('username', username)
        .order('submit_at', { ascending: false })
        .limit(20);

      const gradesByClass = new Map<string, { score: number; week: number }>();
      
      if (grades) {
        grades.forEach(g => {
          const existing = gradesByClass.get(g.class_name);
          if (!existing || g.score > existing.score) {
            gradesByClass.set(g.class_name, {
              score: g.score,
              week: g.week
            });
          }
        });
      }

      const recentGrades = Array.from(gradesByClass.entries())
        .slice(0, 4)
        .map(([subject, data]) => ({
          subject,
          score: data.score,
          week: data.week
        }));

      return {
        gpa: stats?.gpa || 0,
        totalTests: stats?.total_tests || 0,
        passRate: stats?.pass_rate || 0,
        recentGrades
      };
    } catch (error) {
      
      return { gpa: 0, totalTests: 0, passRate: 0, recentGrades: [] };
    }
  },
};
