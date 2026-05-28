import axios from 'axios';
import { IMediaRepository } from '../../domain/repositories/IMediaRepository';

export class CloudinaryAdapter implements IMediaRepository {
  private readonly cloudName = 'TU_CLOUD_NAME'; // Reemplazar o usar variables de entorno (.env)
  private readonly uploadPreset = 'pos_ecosistema_preset'; 
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  }

  async uploadImage(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      
      // React Native requiere este formato específico para archivos locales en FormData
      const fileName = imageUri.split('/').pop() || 'upload.jpg';
      const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: fileName,
        type: fileType,
      } as any);

      // Usamos el preset no firmado
      formData.append('upload_preset', this.uploadPreset);

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Retornamos la URL segura de la imagen subida
      return response.data.secure_url;

    } catch (error) {
      console.error('Error subiendo imagen a Cloudinary:', error);
      throw new Error('No se pudo subir la imagen al servidor de medios.');
    }
  }
}