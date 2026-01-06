import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { supabase, isDemoMode } from '../services/supabaseClient';
import { User as UserType } from '../types';
import { INITIAL_USERS } from '../constants';

interface AuthState {
  user: UserType | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserType; session: any } }
  | { type: 'LOGIN_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        loading: false,
        error: null,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on app start
  useEffect(() => {
    const checkSession = async () => {
      // Check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session) {
        // Get user info from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (userError || !userData) {
          console.error('Error getting user data:', userError);
          return;
        }

        const user: UserType = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          metadata: userData.metadata,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          auth_id: userData.auth_id,
          role: userData.role as any, // Handle both string and UserRole enum
          username: userData.email,
          modulePermissions: userData.metadata?.permissions || {}
        };

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, session }
        });
      }
    };

    checkSession();

    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (event === 'SIGNED_OUT') {
            dispatch({ type: 'LOGOUT' });
          } else if (session && state.user) {
            // Refreshed session, update state
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .single();

            if (!userError && userData) {
              const user: UserType = {
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                avatar_url: userData.avatar_url,
                metadata: userData.metadata,
                created_at: userData.created_at,
                updated_at: userData.updated_at,
                auth_id: userData.auth_id,
                role: userData.role as any,
                username: userData.email,
                modulePermissions: userData.metadata?.permissions || {}
              };

              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user, session }
              });
            }
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Use Supabase for authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (error) {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: { error: error.message }
        });
        return;
      }

      if (data.session) {
        // Get user info from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single();

        if (userError || !userData) {
          dispatch({
            type: 'LOGIN_FAILURE',
            payload: { error: '用户数据获取失败' }
          });
          return;
        }

        const user: UserType = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          metadata: userData.metadata,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          auth_id: userData.auth_id,
          role: userData.role as any, // Handle both string and UserRole enum
          username: userData.email,
          modulePermissions: userData.metadata?.permissions || {}
        };

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, session: data.session }
        });
      }
    } catch (error: any) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: { error: error.message || '登录失败' }
      });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      
      dispatch({ type: 'LOGOUT' });
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: { error: error.message || '登出失败' }
      });
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      if (session) {
        // Get user info from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (userError || !userData) {
          throw new Error('用户数据获取失败');
        }

        const user: UserType = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          metadata: userData.metadata,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          auth_id: userData.auth_id,
          role: userData.role as any,
          username: userData.email,
          modulePermissions: userData.metadata?.permissions || {}
        };

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, session }
        });
      }
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: { error: error.message || '会话刷新失败' }
      });
      // If refresh fails, log out the user
      logout();
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};