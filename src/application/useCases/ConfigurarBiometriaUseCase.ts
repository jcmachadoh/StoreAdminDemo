import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';
import { SecurityHash } from '../../domain/entities/Empleado';

export class ConfigurarBiometriaUseCase {
  private security: SecurityAdapter;
  private localDb: LocalStorageAdapter;

  constructor() {
    this.security = new SecurityAdapter();
    this.localDb = new LocalStorageAdapter();
  }

  async ejecutar(empleadoId: string, tokenGithub: string): Promise<{ exito: boolean; mensaje: string }> {
    const biometriaDisponible = await this.security.verificarBiometriaDisponible();
    
    if (!biometriaDisponible) {
      return { exito: false, mensaje: 'Tu dispositivo no soporta o no tiene configurada la biometría.' };
    }

    try {
      // 1. Pedimos al usuario que ponga su huella para confirmar
      // (Reutilizamos la función del Keychain que fuerza el prompt biométrico)
      const credenciales = await this.security.obtenerCredencialesConBiometria();
      if (!credenciales) {
        return { exito: false, mensaje: 'Autenticación biométrica cancelada.' };
      }

      // 2. Generamos un "Secreto Biométrico" único para este dispositivo
      // RNF22: Usamos SHA-256 para no guardar texto plano
      const { hash: biometriaHash, salt: biometriaSalt } = this.security.generarHash(`biometria_${empleadoId}_${Date.now()}`);

      const securityData: SecurityHash = {
        empleado_uuid: empleadoId,
        hash: biometriaHash,
        salt: biometriaSalt,
        metodo: 'biometria'
      };

      // 3. RF10: Guardamos el hash REMOTAMENTE en GitHub
      console.log('Subiendo ancla de seguridad a GitHub...');
      const githubApi = new GitHubApiAdapter(tokenGithub);
      const pathRemoto = `security/${empleadoId}_hash.json`;
      
      // Intentamos obtener el SHA si el archivo ya existía (ej. reinstalación de app)
      let shaAnterior = '';
      try {
        const archivoPrevio = await githubApi.getFile<any>(pathRemoto);
        shaAnterior = archivoPrevio.sha;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) { /* Es normal que falle si es la primera vez */ }
      // Como nuestro GitHubApiAdapter updateFile actualiza o crea si no existe
      // requerimos pasar el SHA anterior si existe, o omitirlo/vacío si es nuevo.
      await githubApi.updateFile(pathRemoto, securityData, shaAnterior, `🔒 Security: Configuración biométrica para ${empleadoId}`);

      // 4. RF10: Guardamos el hash LOCALMENTE en MMKV
      console.log('Guardando ancla de seguridad en MMKV local...');
      this.localDb.guardarHashSeguridad(securityData);

      return { exito: true, mensaje: 'Huella dactilar configurada exitosamente.' };

    } catch (error: any) {
      console.error('Error configurando biometría:', error);
      return { exito: false, mensaje: 'Ocurrió un error al vincular tu huella con el servidor.' };
    }
  }
}