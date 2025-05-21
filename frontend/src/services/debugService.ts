/**
 * Servicio de depuración para centralizar logs
 */

// Logs para peticiones API
export const apiRequest = (method: string, url: string, data?: any): void => {
  console.log(`[API Request] ${method.toUpperCase()} ${url}`, data);
};

export const apiRequestError = (error: any): void => {
  console.error('[API Request Error]', error);
};

export const apiResponse = (status: number, url: string, data: any): void => {
  console.log(`[API Response] ${status} ${url}`, data);
};

export const apiResponseError = (error: any): void => {
  if (error.response) {
    console.error(
      `[API Response Error] ${error.response.status} ${error.config?.url || ''}`,
      error.response.data
    );
  } else {
    console.error('[API Response Error] No response', error.message);
  }
};

// Logs para componentes
export const componentMount = (componentName: string): void => {
  console.log(`[Component] ${componentName} montado`);
};

export const componentUnmount = (componentName: string): void => {
  console.log(`[Component] ${componentName} desmontado`);
};

export const componentUpdate = (componentName: string, props?: any, state?: any): void => {
  console.log(`[Component] ${componentName} actualizado`, { props, state });
};

// Logs generales
export const logInfo = (message: string, data?: any): void => {
  console.log(`[Info] ${message}`, data || '');
};

export const logWarning = (message: string, data?: any): void => {
  console.warn(`[Warning] ${message}`, data || '');
};

export const logError = (message: string, error?: any): void => {
  console.error(`[Error] ${message}`, error || '');
};

export default {
  apiRequest,
  apiRequestError,
  apiResponse,
  apiResponseError,
  componentMount,
  componentUnmount,
  componentUpdate,
  logInfo,
  logWarning,
  logError
}; 