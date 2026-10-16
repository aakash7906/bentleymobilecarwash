export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  isVipMember: boolean
  loyaltyPoints: number
}

const CURRENT_USER_KEY = 'bentley_current_user'

export const authService = {
  getCurrentUser: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY)
      if (data) return JSON.parse(data)
    } catch {
      // ignore
    }
    return {
      id: 'vip-user-01',
      name: 'Julian Sterling',
      email: 'julian.sterling@luxury.io',
      phone: '(310) 849-2144',
      isVipMember: true,
      loyaltyPoints: 420,
    }
  },

  signInGuest: (name: string, email: string, phone: string): UserProfile => {
    const user: UserProfile = {
      id: 'guest-' + Date.now(),
      name,
      email,
      phone,
      isVipMember: false,
      loyaltyPoints: 50,
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    return user
  },

  signOut: () => {
    localStorage.removeItem(CURRENT_USER_KEY)
  },
}
