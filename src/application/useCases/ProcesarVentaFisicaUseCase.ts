import { GitHubApiAdapter } from '../../infrastructure/api/GitHubApiAdapter';
import { SecurityAdapter } from '../../infrastructure/security/SecurityAdapter';
import { LocalStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';

export interface ClienteData {
    nombre: string;
    tipoPago: string;
    carnet?: string;
    telefono?: string;
}

export class ProcesarVentaFisicaUseCase {
    private security = new SecurityAdapter();
    private localDb = new LocalStorageAdapter();

    async ejecutar(carrito: any[], sucursalId: string, cliente: ClienteData): Promise<{ exito: boolean; mensaje: string }> {
        try {
            // 1. ARMA EL TICKET COMPLETO CON LOS DATOS DEL CLIENTE
            const empleado = this.localDb.obtenerDatosEmpleadoLogueado();

            const nuevaVenta = {
                id: `ticket-${Date.now()}`,
                fecha: new Date().toISOString(),
                sucursalId,
                vendedor: {
                    id: empleado?.id || 'desconocido',
                    nombre: empleado?.nombre || 'Cajero General'
                },
                cliente: {
                    nombre: cliente.nombre || 'Cliente General',
                    tipoPago: cliente.tipoPago,
                    carnet: cliente.carnet || 'N/A',
                    telefono: cliente.telefono || 'N/A'
                },
                items: carrito.map(item => ({
                    sku: item.producto.sku,
                    nombre: item.producto.nombre,
                    precio_unitario: item.producto.precio,
                    cantidad: item.cantidad,
                    subtotal: item.producto.precio * item.cantidad
                })),
                total: carrito.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0)
            };

            // 2. GUARDAMOS EN LA COLA OFFLINE DE MMKV (Éxito instantáneo)
            this.localDb.guardarVentaPendiente(nuevaVenta);

            // 3. SE DESCONECTA A SEGUNDO PLANO PARA SUBIRLO A GITHUB
            this.sincronizarEnSegundoPlano(nuevaVenta, sucursalId).catch(err => {
                console.log('Modo Offline: Venta guardada localmente de forma segura.', err);
            });

            return { exito: true, mensaje: 'Venta autorizada y registrada localmente.' };

        } catch (error: any) {
            console.log(error);

            return { exito: false, mensaje: 'Error al escribir en la base de datos local.' };
        }
    }

    private async sincronizarEnSegundoPlano(venta: any, sucursalId: string) {
        const credenciales = await this.security.obtenerCredencialesSilenciosas();
        if (!credenciales) return;

        const githubApi = new GitHubApiAdapter(credenciales.githubToken);
        const sufijo = sucursalId.replace('suc-', '').replace(/-/g, '_');

        // Rutas de archivos
        const stockPath = `sucursal_${sufijo}/stock_${sucursalId.replace(/-/g, '_')}.json`;
        const ventasPath = `sucursal_${sufijo}/ventas_${sucursalId.replace(/-/g, '_')}.json`;

        // --- SUB-PROCESO 1: DESCONTAR STOCK ---
        try {
            const { data: stockData, sha: stockSha } = await githubApi.getFile<any>(stockPath);
            const stockActual = stockData.stock || [];
            venta.items.forEach((itemCart: any) => {
                const index = stockActual.findIndex((s: any) => s.sku === itemCart.sku);
                if (index !== -1) {
                    stockActual[index].cantidad = Math.max(0, stockActual[index].cantidad - itemCart.cantidad);
                }
            });
            await githubApi.updateFile(stockPath, { ...stockData, stock: stockActual }, stockSha, `📉 POS Stock update: ${venta.id}`);
        } catch (e) {
            console.error('Error al descontar stock en la nube:', e);
        }

        // --- SUB-PROCESO 2: REGISTRAR LA VENTA EN EL JSON ---
        try {
            let ventasActuales = [];
            let ventasSha = '';

            try {
                // Intentamos descargar el archivo de ventas existente
                const { data: fileData, sha } = await githubApi.getFile<any>(ventasPath);
                ventasActuales = fileData.ventas || [];
                ventasSha = sha;
            } catch (error) {
                console.log(error);
                // Si da error 404 (no existe), nace un array vacío y el SHA se queda en ''
                console.log('Creando nuevo historial de ventas para la sucursal...');
            }

            // Añadimos la nueva venta al historial
            ventasActuales.push(venta);

            // Subimos el JSON actualizado o nuevo a GitHub
            await githubApi.updateFile(ventasPath, { sucursal_id: sucursalId, ventas: ventasActuales }, ventasSha, `💰 Venta Física Registrada: ${venta.id}`);

            // Si todo sale bien, lo sacamos de la cola de pendientes
            this.localDb.removerVentaPendiente(venta.id);
            console.log(`✅ Transacción completa en la nube para el ticket: ${venta.id}`);
        } catch (e) {
            console.error('Error al registrar la venta en GitHub:', e);
        }
    }
}