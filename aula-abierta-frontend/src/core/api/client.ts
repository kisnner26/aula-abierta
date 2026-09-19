import axios, { type AxiosInstance } from 'axios'
import { env } from '../config/env'

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false,
})
