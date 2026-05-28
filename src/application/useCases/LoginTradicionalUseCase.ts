import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';
import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';

export class LoginTradicionalUseCase {
  private security = new SecurityAdapter();
  private localDb = new LocalStorageAdapter();

  async ejecutar(usernameInput: string, passwordInput: string, tokenNuevoDispositivo?: string): Promise<{ exito: boolean; mensaje: string; token?: string; empleadoId?: string }> {
    
    // 1. Buscamos el token en el hardware
    let credenciales = await this.security.obtenerCredencialesSilenciosas();
    let tokenAUsar = credenciales?.githubToken || tokenNuevoDispositivo;

    // Si no hay token guardado y el usuario no pasó uno, le decimos a la UI que lo pida
    if (!tokenAUsar) {
      return { exito: false, mensaje: 'NUEVO_DISPOSITIVO' }; 
    }

    try {
      // 2. Revisamos si tenemos al empleado en caché local (dispositivo ya vinculado)
      let empleadoData = this.localDb.obtenerDatosEmpleadoLogueado();

      // Si no hay caché local (es un dispositivo nuevo), descargamos de GitHub
      if (!empleadoData) {
        console.log('Dispositivo nuevo detectado. Descargando datos de GitHub...');
        const githubApi = new GitHubApiAdapter(tokenAUsar);
        const { empleados } = await githubApi.obtenerRegistroEmpleados();
        
        // Buscamos al empleado por su username
        empleadoData = empleados.find((emp: any) => emp.username === usernameInput);
        
        if (!empleadoData || !empleadoData.activo) {
          return { exito: false, mensaje: 'Usuario no encontrado o cuenta inactiva.' };
        }
      } else {
        // Validación extra: Que el usuario escrito coincida con el guardado localmente
        if (empleadoData.username !== usernameInput) {
          return { exito: false, mensaje: 'El usuario no coincide con el registrado en este dispositivo.' };
        }
      }

      // 3. Validamos la contraseña usando la sal del empleado
      const { hash } = this.security.generarHash(passwordInput, empleadoData.salt);

      if (hash === empleadoData.hash_password) {
        // Si el login es exitoso en un dispositivo nuevo, guardamos todo en local
        if (!credenciales && tokenNuevoDispositivo) {
          await this.security.guardarCredencialesSeguras(empleadoData.id, tokenNuevoDispositivo);
          this.localDb.guardarDatosEmpleadoLogueado(empleadoData);
        }
        
        return { exito: true, mensaje: 'Bienvenido', token: tokenAUsar, empleadoId: empleadoData.id };
      } else {
        return { exito: false, mensaje: 'Contraseña incorrecta.' };
      }
    } catch (error) {
        console.log(error);
      return { exito: false, mensaje: 'Error de conexión o Token inválido.' };
    }
  }
}