import { createContext } from 'react';
import type { AuthContextType } from './auth.provider';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);