import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { env } from './env'

const memory = new Map<string, string>()

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : memory.get(key) ?? null
    }
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return memory.get(key) ?? null
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
      else memory.set(key, value)
      return
    }
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {
      memory.set(key, value)
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
      else memory.delete(key)
      return
    }
    try {
      await SecureStore.deleteItemAsync(key)
    } catch {
      memory.delete(key)
    }
  },
}

export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
