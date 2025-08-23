# ✈️ Airline Check-In API

API REST para gestionar vuelos, pasajeros y la **asignación automática de asientos**.  
Proyecto desarrollado como parte del desafío técnico de **Bsale**.
## 🚀 Tecnologías usadas
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MySQL](https://www.mysql.com/) (con `mysql2/promise`)
- [dotenv](https://github.com/motdotla/dotenv) para manejo de variables de entorno
- Arquitectura modular:
  - `controllers` → controladores de rutas
  - `services` → lógica de negocio (asignación de asientos)
  - `routes` → definición de endpoints
  - `config` → conexión a base de datos
  - `utils` → helpers para respuestas

---

## ⚙️ Instalación y ejecución

1. **Clonar el repositorio**
```bash
git clone https://github.com/RamiroUrt/Airline-Check-In.git
cd airline-checkin-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**  
Crear un archivo `.env` en la raíz con las credenciales de la base de datos:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=airline
DB_PORT=3306
PORT=3000
```

4. **Importar la base de datos**  
En MySQL importar el archivo `airline.sql` provisto:
```sql
source airline.sql;
```

5. **Levantar el servidor**
```bash
npm run dev
```
La API quedará disponible en:  
👉 `http://localhost:3000`

---

## 📖 Endpoints principales

### Obtener pasajeros de un vuelo con asignación de asientos
```http
GET /flights/:id
```

**Ejemplo:**
```
GET http://localhost:3000/flights/1
```

**Respuesta:**
```json
{
  "code": 200,
  "data": {
    "flightId": 1,
    "takeoffDateTime": 1688207580,
    "takeoffAirport": "Aeropuerto Internacional Arturo Merino Benitez, Chile",
    "landingDateTime": 1688221980,
    "landingAirport": "Aeropuerto Internacional Jorge Cháve, Perú",
    "airplaneId": 1,
    "passengers": [
      {
        "passengerId": 11,
        "dni": "967142004",
        "name": "Víctor",
        "age": 73,
        "country": "Chile",
        "boardingPassId": 504,
        "purchaseId": 3,
        "seatTypeId": 3,
        "seatId": 24
      },
      {
        "passengerId": 499,
        "dni": "287279248",
        "name": "Maritza",
        "age": 34,
        "country": "Chile",
        "boardingPassId": 595,
        "purchaseId": 3,
        "seatTypeId": 3,
        "seatId": 52
      }
    ]
  }
}
```

---

## 🧠 Lógica de asignación de asientos

1. Los pasajeros se agrupan por `purchase_id` (compra).
2. Se valida que **los menores siempre estén acompañados por adultos**.
3. Estrategia de asignación:
   - Intento 1 → Asientos contiguos en la misma fila.
   - Intento 2 → Asientos en filas adyacentes.
   - Intento 3 → Asignar los asientos más cercanos posibles.
   - Último recurso → asignación individual.
4. Se garantiza que cada pasajero tenga un asiento asignado (`seat_id`).

**Ejemplo de logs internos:**
```
✓ Grupo 79 asignado: 14C
✓ Grupo 204 asignado: 14G
Asignación de asientos completada exitosamente
```

---

## 📌 Notas adicionales
- Endpoint de prueba: `/test/:id` (para debuggear la asignación).
- Todas las respuestas siguen un formato normalizado:
```json
{ "code": <status>, "data": {...}, "errors": <msg> }
```

---

## 📤 Entregables
- Código fuente en repositorio privado de GitHub (acceso al usuario `postulaciones-bsale`).
- API desplegada en un servicio cloud (ejemplo: Render, Railway, AWS).
- CV en PDF.
- Este archivo `README.md`.

---
