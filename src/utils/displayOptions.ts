export const checkDisplayOptions = async (): Promise<boolean> => {
  try {
    // Check localStorage for display options
    const displayCarousel = localStorage.getItem('displayCarousel');
    const displayQR = localStorage.getItem('displayQR') === 'true';
    
    // If displayCarousel is not set, default to true (tablet is default)
    if (displayCarousel === null) {
      localStorage.setItem('displayCarousel', 'true');
      return true;
    }
    
    // Check if at least one option is selected
    return displayCarousel === 'true' || displayQR;
  } catch (error) {
    console.error('Error in checkDisplayOptions:', error);
    // Default to true since tablet is now the default
    return true;
  }
};
