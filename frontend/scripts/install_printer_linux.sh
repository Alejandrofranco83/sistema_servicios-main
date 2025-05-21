#!/usr/bin/env bash
# Uso: sudo ./install_printer_linux.sh servidor printer_share
SERVER="${1:-pc-server}"
SHARE="${2:-TICKET_58}"
URI="ipp://${SERVER}/ipp/print"

# Verificar si CUPS está instalado
if ! command -v lpadmin >/dev/null 2>&1; then
  echo "CUPS no está instalado. Instalando..."
  sudo apt-get update && sudo apt-get install -y cups
fi

# Verificar permisos de administrador
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta este script como root o con sudo"
  exit 1
fi

# Instalar el controlador para impresoras térmicas
echo "Instalando driver genérico para impresoras térmicas..."
apt-get install -y printer-driver-escpr

# Añadir la impresora
echo "Instalando impresora ${SHARE} desde ${SERVER}..."
lpadmin -p "${SHARE}" -E -v "${URI}" -m raw -o raw -d

# Establecer opciones por defecto
echo "Configurando opciones por defecto..."
lpoptions -p "${SHARE}" -o media=Custom.58x250mm -o page-right=0 -o page-left=0 -o page-top=0 -o page-bottom=0

# Verificar si la instalación fue exitosa
if lpstat -v | grep -q "${SHARE}"; then
  echo "Impresora ${SHARE} instalada correctamente"
  echo "URI: ${URI}"
  echo "Para probar:"
  echo "  echo 'Prueba de impresión' | lp -d ${SHARE}"
else
  echo "Error al instalar la impresora"
  exit 1
fi 