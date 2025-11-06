export const checkDisplayOptions = async (): Promise<boolean> => {
  try {
    // Check localStorage for display options
    const displayCarousel = localStorage.getItem('displayCarousel') === 'true';
    const displayQR = localStorage.getItem('displayQR') === 'true';
    
    // Check if at least one option is selected
    return displayCarousel || displayQR;
  } catch (error) {
    console.error('Error in checkDisplayOptions:', error);
    return false;
  }
};
