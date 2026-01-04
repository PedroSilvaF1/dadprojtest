import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

const STORAGE_KEY = 'email_verification'

export const useEmailVerificationStore = defineStore('emailVerification', () => {
  const email = ref('')
  const countdown = ref(0)
  const nextResendAt = ref(0)
  const loading = ref(false)
  const message = ref('')
  const error = ref('')
  let timerId = null

  const saveState = () => {
    const payload = {
      email: email.value,
      nextResendAt: nextResendAt.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  const loadState = () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }
    try {
      const payload = JSON.parse(raw)
      email.value = payload.email || ''
      nextResendAt.value = Number(payload.nextResendAt) || 0
      const remaining = Math.ceil((nextResendAt.value - Date.now()) / 1000)
      if (remaining > 0) {
        startCountdown(remaining, { persist: false, setNextResendAt: false })
      } else {
        nextResendAt.value = 0
        countdown.value = 0
        saveState()
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const setEmail = (value) => {
    email.value = value || ''
    saveState()
  }

  const startCountdown = (seconds = 60, options = {}) => {
    const { persist = true, setNextResendAt = true } = options
    if (timerId) {
      clearInterval(timerId)
    }
    if (setNextResendAt) {
      nextResendAt.value = Date.now() + seconds * 1000
    }
    countdown.value = seconds
    if (persist) {
      saveState()
    }
    timerId = setInterval(() => {
      if (countdown.value <= 1) {
        clearInterval(timerId)
        timerId = null
        countdown.value = 0
        nextResendAt.value = 0
        saveState()
        return
      }
      countdown.value -= 1
    }, 1000)
  }

  const stopCountdown = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  const resetMessages = () => {
    message.value = ''
    error.value = ''
  }

  const resend = async () => {
    resetMessages()

    if (!email.value) {
      error.value = 'Please return to register and enter your email'
      return
    }

    loading.value = true
    try {
      const response = await api.post('/email/verification-notification', { email: email.value })
      message.value = response.data?.message || 'Verification link sent'
      startCountdown()
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        error.value = e.response.data.message
      } else {
        error.value = 'Failed to resend verification email'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    email,
    countdown,
    nextResendAt,
    loading,
    message,
    error,
    loadState,
    setEmail,
    startCountdown,
    stopCountdown,
    resetMessages,
    resend,
  }
})
