const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.API_URL_DEV
  : import.meta.env.API_URL_PROD

export { API_BASE_URL }
