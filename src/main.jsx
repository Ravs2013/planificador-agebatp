import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './styles/globals.css'

// Detectar fallos en la importación dinámica (por ejemplo, cuando se despliega una nueva versión
// y los fragmentos/chunks antiguos ya no existen en el servidor de Firebase) y recargar la página.
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    (event.target && event.target.tagName === 'SCRIPT' && event.target.src && event.target.src.includes('/assets/'))
  ) {
    console.warn('Se detectó un fallo al cargar un módulo dinámico. Recargando la aplicación para obtener la versión más reciente...', msg);
    window.location.reload();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = event.reason?.message || '';
  if (
    errorMsg.includes('Failed to fetch dynamically imported module') ||
    errorMsg.includes('Importing a module script failed')
  ) {
    console.warn('Rechazo no manejado por carga de módulo dinámico. Recargando la aplicación...', errorMsg);
    window.location.reload();
  }
});


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
)
