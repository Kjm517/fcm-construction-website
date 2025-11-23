// Navigation utility functions

import { useRouter } from 'next/navigation';

/**
 * Create a back button handler that prevents navigation loops
 */
export function useBackNavigation(defaultPath: string = '/admin') {
  const router = useRouter();
  
  return () => {
    router.push(defaultPath);
  };
}

