export interface IMediaRepository {
  /**
   * Sube una imagen y devuelve su URL pública.
   * @param imageUri La ruta local de la imagen en el dispositivo
   */
  uploadImage(imageUri: string): Promise<string>;
}