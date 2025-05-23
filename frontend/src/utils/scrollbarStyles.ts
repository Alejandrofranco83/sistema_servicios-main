// Estilos unificados para scrollbars oscuros utilizados en toda la aplicación
export const scrollbarStyles = {
  // Para WebKit (Chrome, Safari, Edge)
  '&::-webkit-scrollbar': {
    width: '12px',
    height: '12px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#121212', // Casi negro
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#333', // Gris muy oscuro
    borderRadius: '6px',
    '&:hover': {
      backgroundColor: '#444', // Ligeramente más claro al pasar el mouse
    },
  },
  // Para Firefox
  scrollbarColor: '#333 #121212', // Formato: thumb track
  scrollbarWidth: 'thin',
};

// Estilos globales para aplicar a toda la aplicación usando GlobalStyles
export const globalScrollbarStyles = {
  '*::-webkit-scrollbar': {
    width: '12px',
    height: '12px',
  },
  '*::-webkit-scrollbar-track': {
    backgroundColor: '#121212', // Casi negro
  },
  '*::-webkit-scrollbar-thumb': {
    backgroundColor: '#333', // Gris muy oscuro
    borderRadius: '6px',
    '&:hover': {
      backgroundColor: '#444', // Ligeramente más claro al pasar el mouse
    },
  },
  'html': {
    scrollbarColor: '#333 #121212', // Formato: thumb track
    scrollbarWidth: 'thin',
  },
  'body': {
    scrollbarColor: '#333 #121212',
    scrollbarWidth: 'thin',
  }
}; 