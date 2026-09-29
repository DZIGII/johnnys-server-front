import { apiClient } from "./client"
import type {
  RegisterDto,
  LoginDto,
  VerifyDto,
  UserDto,
  AuthResponse,
  EnableDisableDto,
  FilterUsersQuery,
} from "./types"

export const userApi = {
  register: (data: RegisterDto) =>
    apiClient.post<{ message: string }>("/users/register", data),

  login: (data: LoginDto) =>
    apiClient.post<AuthResponse>("/users/login", data),

  verify: (data: VerifyDto) =>
    apiClient.post<AuthResponse>("/users/verify", data),

  enable: (data: EnableDisableDto) =>
    apiClient.post<{ message: string }>("/users/enable", data),

  disable: (data: EnableDisableDto) =>
    apiClient.post<{ message: string }>("/users/disable", data),

  getById: (id: string) =>
    apiClient.get<UserDto>(`/users/${id}`),

  filter: (query: FilterUsersQuery = {}) =>
    apiClient.get<UserDto[]>("/users/", { params: query }),
}
