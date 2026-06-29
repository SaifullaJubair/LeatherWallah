/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react'

import { BASE_URL } from '../utils/baseURL'

export const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin_reg_log`, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()

      if (data?.statusCode === 200 && data?.success === true) {
        setUser(data?.data)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      // console.error("Error fetching user data:", error);
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const info = {
    user,
    loading,
  }


  return <AuthContext.Provider value={info}>{children}</AuthContext.Provider>
}

export default AuthProvider
