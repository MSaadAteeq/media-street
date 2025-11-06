import { useEffect, useState } from 'react';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';
import posImage from '@/assets/customer-using-pos.png';

interface TransparentPOSImageProps {
  className?: string;
  alt?: string;
}

const TransparentPOSImage = ({ className = "", alt = "POS System" }: TransparentPOSImageProps) => {
  const [transparentImageUrl, setTransparentImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processImage = async () => {
      try {
        setIsProcessing(true);
        console.log('Loading POS image for background removal...');
        
        // Load the original image
        const originalImage = await loadImageFromUrl(posImage);
        
        // Remove the background
        const transparentBlob = await removeBackground(originalImage);
        
        // Create a URL for the transparent image
        const url = URL.createObjectURL(transparentBlob);
        setTransparentImageUrl(url);
        
        console.log('Background removal completed successfully');
      } catch (error) {
        console.error('Failed to remove background:', error);
        // Fallback to original image if background removal fails
        setTransparentImageUrl(posImage);
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();

    // Cleanup
    return () => {
      if (transparentImageUrl && transparentImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(transparentImageUrl);
      }
    };
  }, []);

  if (isProcessing || !transparentImageUrl) {
    return (
      <img 
        src={posImage} 
        alt={alt}
        className={`${className} opacity-50`}
      />
    );
  }

  return (
    <img 
      src={transparentImageUrl} 
      alt={alt}
      className={className}
    />
  );
};

export default TransparentPOSImage;