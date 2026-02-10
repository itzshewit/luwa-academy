
/*
  Luwa Academy – Auth Support Service
  Purpose: Provides student type metadata for tracking services.
*/
import { storageService } from './storageService.ts';
import { Stream } from '../types.ts';

export function getStudentType(studentId?: string): string {
  const user = storageService.getSession();
  // Map Stream enum to lowercase strings expected by the Note Service
  if (user?.stream === Stream.NATURAL) return 'natural';
  if (user?.stream === Stream.SOCIAL) return 'social';
  return 'natural'; // Default fallback
}
