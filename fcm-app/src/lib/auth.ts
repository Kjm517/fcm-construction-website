// Authentication and user utility functions

/**
 * Get current user's display name (full name, username, or default)
 */
export async function getCurrentUserDisplayName(): Promise<string> {
  if (typeof window === 'undefined') return 'Admin';
  
  const userId = localStorage.getItem('admin-user-id');
  const username = localStorage.getItem('admin-username') || 'Admin';
  
  if (!userId) return username;
  
  try {
    const profileResponse = await fetch(`/api/profile?userId=${userId}`);
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      return profile.full_name || profile.username || username;
    }
  } catch (error) {
    // Silently fail and return username
  }
  
  return username;
}

/**
 * Get current user info synchronously (returns username only)
 */
export function getCurrentUserSync(): { id: string | null; username: string } {
  if (typeof window === 'undefined') {
    return { id: null, username: 'Admin' };
  }
  
  return {
    id: localStorage.getItem('admin-user-id'),
    username: localStorage.getItem('admin-username') || 'Admin',
  };
}

