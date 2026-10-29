import { api } from './api.js';

async function listAll(path) {
  const result = [];
  for (let pagina = 1; ; pagina++) {
    const page = await api(path + '?pagina=' + pagina + '&tamanoPagina=100');
    if (!Array.isArray(page)) throw new Error('La API devolvió un listado inválido.');
    result.push(...page);
    if (page.length < 100) return result;
  }
}

export async function loadUserDirectory() {
  const [users, people, profiles] = await Promise.all([
    listAll('/api/usuarios/usuarios'),
    listAll('/api/usuarios/personas'),
    listAll('/api/usuarios/perfiles'),
  ]);
  return {
    people,
    profiles,
    users: users.map(user => {
      const person = people.find(x => x.id === user.personaId);
      return {
        id: user.id,
        personId: user.personaId,
        username: user.nombreUsuario,
        name: person ? [person.nombres, person.apellidos].join(' ') : user.nombreUsuario,
        role: profiles.find(x => x.id === user.perfilId)?.nombre || 'Sin perfil',
        active: user.activo,
      };
    }),
  };
}

export function createUser(values) {
  return api('/api/usuarios/usuarios', {
    nombreUsuario: values.username,
    password: values.password,
    personaId: Number(values.personaId),
    perfilId: Number(values.perfilId),
  });
}
