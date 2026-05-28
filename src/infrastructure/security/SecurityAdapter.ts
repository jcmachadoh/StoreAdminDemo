import * as Keychain from 'react-native-keychain';
import crypto from 'react-native-quick-crypto';
import ReactNativeBiometrics from 'react-native-biometrics';

export class SecurityAdapter {
  private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics();
  }

  // --- 1. CRIPTOGRAFÍA (SHA-256) ---

  /** Genera un hash seguro con salt aleatoria (RNF22) */
  generarHash(datos: string, saltExistente?: string): { hash: string; salt: string } {
    const salt = saltExistente || crypto.randomBytes(16).toString('hex');
    // Esto es lo que usaremos tanto para la contraseña como para la biometría
    const hash = crypto.createHash('sha256').update(datos + salt).digest('hex');
    return { hash, salt };
  }

  // --- 2. GESTIÓN DE BIOMETRÍA Y KEYCHAIN ---

  /** Verifica si el dispositivo soporta biometría */
  async verificarBiometriaDisponible(): Promise<boolean> {
    const { available } = await this.rnBiometrics.isSensorAvailable();
    return available;
  }

  /** * Guarda el Token de GitHub y el UUID del empleado en el Keystore de Android.
   * Exige que el usuario ponga su huella para poder acceder a ellos después.
   */
  async guardarCredencialesSeguras(empleadoUuid: string, githubToken: string): Promise<boolean> {
    try {
      const dataString = JSON.stringify({ empleadoUuid, githubToken });
      
      // 1. Caja Fuerte Silenciosa (Para cuando entras con contraseña)
      await Keychain.setGenericPassword('ecosistema_pos', dataString, {
        service: 'auth_silenciosa'
      });

      // 2. Caja Fuerte Biométrica (Para obligar al OS a sacar la ventanita)
      await Keychain.setGenericPassword('ecosistema_pos_bio', dataString, {
        service: 'auth_biometrica',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async obtenerCredencialesConBiometria(): Promise<{ empleadoUuid: string; githubToken: string } | null> {
    try {
      // Al pedir el service 'auth_biometrica', el teléfono OSCURECERÁ la pantalla y pedirá la huella
      const credentials = await Keychain.getGenericPassword({ 
        service: 'auth_biometrica',
        authenticationPrompt: { title: 'Acceso Seguro', subtitle: 'Coloca tu dedo en el sensor' }
      });
      if (credentials) return JSON.parse(credentials.password);
      return null;
    } catch (error) {
      console.log(error);
      return null; // El usuario canceló la huella o falló
    }
  }

  async obtenerCredencialesSilenciosas(): Promise<{ empleadoUuid: string; githubToken: string } | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: 'auth_silenciosa' });
      if (credentials) return JSON.parse(credentials.password);
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  /** Borra las credenciales (Logout) */
  async limpiarCredenciales(): Promise<void> {
    await Keychain.resetGenericPassword();
  }
}