import pool from "../config/database.js";
import { successResponse, notFoundResponse, errorResponse } from "../utils/response.js";
import { assignSeatsToPassengers } from "../services/seatAssignment.js";

export const getFlightPassengers = async (req, res) => {
  const flightId = req.params.id;

  // Validar que flightId sea un número
  if (isNaN(flightId)) {
    return res.status(400).json(errorResponse("El ID de vuelo debe ser un número"));
  }

  try {
    console.log(`Solicitando datos para vuelo ${flightId}`);

    // 1. BUSCAR DATOS DEL VUELO
    const [flights] = await pool.query(
      `SELECT f.*, a.name as airplane_name 
       FROM flight f 
       JOIN airplane a ON f.airplane_id = a.airplane_id 
       WHERE f.flight_id = ?`,
      [flightId]
    );

    if (flights.length === 0) {
      console.log(`Vuelo ${flightId} no encontrado`);
      return res.status(404).json(notFoundResponse());
    }

    const flight = flights[0];
    console.log(`Vuelo encontrado: ${flight.takeoff_airport} -> ${flight.landing_airport}`);

    // 2. TRAER PASAJEROS DEL VUELO
    const [passengers] = await pool.query(
      `SELECT p.passenger_id, p.dni, p.name, p.age, p.country,
              bp.boarding_pass_id, bp.purchase_id, bp.seat_type_id, bp.seat_id,
              st.name as seat_type_name
       FROM passenger p
       JOIN boarding_pass bp ON p.passenger_id = bp.passenger_id
       JOIN seat_type st ON bp.seat_type_id = st.seat_type_id
       WHERE bp.flight_id = ?
       ORDER BY bp.purchase_id, p.age DESC`,
      [flightId]
    );

    if (passengers.length === 0) {
      console.log(`No hay pasajeros para el vuelo ${flightId}`);
    } else {
      console.log(`Encontrados ${passengers.length} pasajeros para el vuelo ${flightId}`);
    }

    // 3. ASIGNAR ASIENTOS
    let passengersWithAssignedSeats;
    try {
      passengersWithAssignedSeats = await assignSeatsToPassengers(
        passengers, 
        flight.airplane_id
      );
      console.log('Asientos asignados exitosamente');
    } catch (assignmentError) {
      console.error('Error en asignación de asientos:', assignmentError);
      // Si falla la asignación
      passengersWithAssignedSeats = passengers;
    }

    // 4. FORMATEAR RESPUESTA EN camelCase
    const response = {
      flightId: flight.flight_id,
      takeoffDateTime: flight.takeoff_date_time,
      takeoffAirport: flight.takeoff_airport,
      landingDateTime: flight.landing_date_time,
      landingAirport: flight.landing_airport,
      airplaneId: flight.airplane_id,
      passengers: passengersWithAssignedSeats.map(p => ({
        passengerId: p.passenger_id,
        dni: p.dni,
        name: p.name,
        age: p.age,
        country: p.country,
        boardingPassId: p.boarding_pass_id,
        purchaseId: p.purchase_id,
        seatTypeId: p.seat_type_id,
        seatId: p.seat_id || null // Asegurar que siempre tenga valor
      }))
    };

    console.log(`Enviando respuesta para vuelo ${flightId}`);
    return res.json(successResponse(response));

  } catch (err) {
    console.error("Error en controller:", err);
    
    // Manejar errores de conexión a la base de datos
    if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(400).json(errorResponse("could not connect to db"));
    }
    return res.status(400).json(errorResponse(err.message || "Error interno del servidor"));
  }
};

