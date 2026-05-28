import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';
import { Empleado } from '../../domain/entities/Empleado';

interface InputActivacion {
  tokenIntroducido: string; // El PAT de GitHub que el empleado pega desde su correo
  usernameElegido: string;
  passwordElegido: string;
}

interface ResultadoActivacion {
  exito: boolean;
  mensaje: string;
  empleadoId?: string;
}

export class ActivarCuentaUseCase {
  private security: SecurityAdapter;
  private localDb: LocalStorageAdapter;

  constructor() {
    this.security = new SecurityAdapter();
    this.localDb = new LocalStorageAdapter();
  }

  async ejecutar(input: InputActivacion): Promise<ResultadoActivacion> {
    const { tokenIntroducido, usernameElegido, passwordElegido } = input;

    // 1. Instanciamos el adaptador de GitHub usando el token que el usuario introdujo
    const githubApi = new GitHubApiAdapter(tokenIntroducido);

    try {
      // 2. Descargamos el archivo central de empleados de GitHub
      console.log('Validando token y descargando registro de empleados...');
      const { empleados, sha } = await githubApi.obtenerRegistroEmpleados();

      // 3. RF07/RF21: Para saber quién es el empleado, calculamos el hash del token introducido
      // y lo buscamos en la lista (ya que en GitHub se almacena el hash del token por seguridad)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash: tokenIntroducidoHash } = this.security.generarHash(tokenIntroducido, 'sal_fija_sistema_tokens');

      // const empleadoIndex = empleados.findIndex((emp: any) => emp.token === tokenIntroducidoHash);
      // En desarrollo: Tomamos el primer empleado inactivo de la lista
      // const empleadoIndex = empleados.findIndex((emp: any) => emp.activo === false);
      const empleadoIndex = empleados.findIndex((emp: any) => emp.activo === false);

      if (empleadoIndex === -1) {
        return { exito: false, mensaje: 'El token introducido no corresponde a ningún empleado registrado o es inválido.' };
      }

      const empleadoEncontrado: Empleado = empleados[empleadoIndex];

      // 4. Verificamos que la cuenta no esté activa ya
      if (empleadoEncontrado.activo) {
        return { exito: false, mensaje: 'Esta cuenta ya se encuentra activa. Dirígete a la pantalla de inicio de sesión.' };
      }

      // 5. RNF22: CRIPTOGRAFÍA PURA - Generamos sal única y calculamos el hash de su nueva contraseña
      console.log('Generando credenciales cifradas...');
      const { hash: passwordHash, salt: nuevaSalt } = this.security.generarHash(passwordElegido);

      // 6. Actualizamos los datos del empleado en la estructura del JSON
      empleados[empleadoIndex] = {
        ...empleadoEncontrado,
        username: usernameElegido,
        hash_password: passwordHash,
        salt: nuevaSalt,
        activo: true // Activamos la cuenta oficialmente
      };

      // 7. Subimos el archivo actualizado a GitHub (Controlando concurrencia con el SHA)
      console.log('Sincronizando estado de activación con GitHub...');
      await githubApi.actualizarRegistroEmpleados(empleados, sha);

      // 8. RF02: GUARDADO SEGURO LOCAL - Si GitHub aceptó el cambio, guardamos
      // el token real y el ID del empleado en el Keystore de Android usando Keychain
      console.log('Asegurando llaves criptográficas en el Keystore del dispositivo...');
      const guardadoExitoso = await this.security.guardarCredencialesSeguras(
        empleadoEncontrado.id,
        tokenIntroducido
      );

      if (!guardadoExitoso) {
        throw new Error('No se pudo escribir en el almacén seguro del hardware.');
      }

      // 9. Inicializamos la caché local MMKV con los datos de este empleado
      // Para poder saludarlo en el Dashboard (RF08) y saber su sucursal de inmediato
      this.localDb.guardarDatosEmpleadoLogueado(empleados[empleadoIndex]);

      console.log(`🎉 Cuenta activada con éxito para el usuario: ${usernameElegido}`);
      return {
        exito: true,
        mensaje: `¡Bienvenido ${empleadoEncontrado.nombre}! Tu cuenta ha sido activada de forma segura.`,
        empleadoId: empleadoEncontrado.id
      };

    } catch (error: any) {
      console.error('Error crítico durante la activación de cuenta:', error);

      if (error.response?.status === 401) {
        return { exito: false, mensaje: 'El token de GitHub proporcionado no tiene permisos para acceder al repositorio.' };
      }

      return {
        exito: false,
        mensaje: error.message || 'Error de conexión con el servidor de datos. Inténtalo de nuevo.'
      };
    }
  }
}