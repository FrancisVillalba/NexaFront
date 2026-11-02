// Contratos de NexaBack: equivalen a los DTOs que recibe y devuelve la API C#.
export interface SessionUserDto {
  accesos: string[];
  usuarioId: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  documento: string | null;
  perfilId: number;
  perfil: string;
}
export interface LoginResponse {
  token: string;
  tipoToken: string;
  expiraEn: string;
  usuario: SessionUserDto;
}
export interface AuthSession {
  token: string;
  expiraEn: string;
}
export interface User {
  accesses: string[];
  id: number;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  document: string | null;
  profileId: number;
  role: string;
  active: boolean;
}
export interface PersonDto {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  creadoEn: string;
}
export interface ProfileDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creadoEn: string;
}
export interface UserDto {
  id: number;
  nombreUsuario: string;
  personaId: number;
  perfilId: number;
  activo: boolean;
  creadoEn: string;
}
export interface DirectoryUser {
  id: number;
  personId: number;
  profileId: number;
  username: string;
  name: string;
  role: string;
  active: boolean;
  personActive: boolean;
  profileActive: boolean;
  document: string | null;
}
export interface UserDirectory {
  users: DirectoryUser[];
  people: PersonDto[];
  profiles: ProfileDto[];
}

// Modelos comerciales locales; todavía no son entidades persistidas en la API.
// Mantiene compatibles los imports existentes; los tipos comerciales tienen su propio archivo.
export type * from "./types/commercial";
