import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';

export interface NuevoEmpleadoData {
  nombre: string;
  email: string;
  sucursalId: string;
  rolesIds: string[];
}

export class AltaEmpleadoUseCase {
  private security = new SecurityAdapter();

  async ejecutar(data: NuevoEmpleadoData): Promise<{ exito: boolean; mensaje: string }> {
    try {
      const credenciales = await this.security.obtenerCredencialesSilenciosas();
      if (!credenciales) throw new Error('No hay sesión activa.');

      const githubApi = new GitHubApiAdapter(credenciales.githubToken);

      // 1. Descargamos el registro central de empleados
      const { data: registroData, sha } = await githubApi.getFile<any>('registro_empleados.json');
      const empleadosActuales = registroData.empleados || [];

      // 2. Verificamos que el email no esté registrado ya
      const emailExiste = empleadosActuales.some((emp: any) => emp.email.toLowerCase() === data.email.toLowerCase());
      if (emailExiste) {
        return { exito: false, mensaje: 'Ya existe un empleado registrado con ese correo electrónico.' };
      }

      // 3. Creamos el "Cascarón" del empleado (RF21)
      const idUnico = `emp-${Math.random().toString(36).substring(2, 10)}`;
      
      const nuevoEmpleado = {
        id: idUnico,
        nombre: data.nombre,
        email: data.email,
        sucursal: data.sucursalId,
        roles: data.rolesIds,
        token: "", // El empleado llenará esto con su hash al activar su cuenta
        activo: false // Nace inactivo por seguridad
      };

      // 4. Lo añadimos a la lista y subimos
      empleadosActuales.push(nuevoEmpleado);
      
      await githubApi.updateFile(
        'registro_empleados.json', 
        { empleados: empleadosActuales }, 
        sha, 
        `👥 Alta de nuevo empleado inactivo: ${data.nombre}`
      );

      return { exito: true, mensaje: 'Empleado registrado. Ya puede proceder a activar su cuenta desde su dispositivo.' };
    } catch (error: any) {
      console.error('Error en alta de empleado:', error);
      return { exito: false, mensaje: 'Error al conectar con la base de datos de empleados.' };
    }
  }
}