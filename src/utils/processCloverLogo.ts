import { removeBackground, loadImageFromUrl } from './backgroundRemoval';

export const processCloverLogo = async (): Promise<string> => {
  try {
    console.log('Loading Clover logo...');
    const img = await loadImageFromUrl('/lovable-uploads/a0ed7029-4b44-48ca-9afd-4e40c7f02b3e.png');
    
    console.log('Removing background...');
    const processedBlob = await removeBackground(img);
    
    // Create a blob URL for the processed image
    const processedUrl = URL.createObjectURL(processedBlob);
    console.log('Clover logo processed successfully');
    
    return processedUrl;
  } catch (error) {
    console.error('Failed to process Clover logo:', error);
    // Fallback to original image
    return '/lovable-uploads/a0ed7029-4b44-48ca-9afd-4e40c7f02b3e.png';
  }
};