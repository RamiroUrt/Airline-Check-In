import pool from '../config/database.js';

// Función principal que distribuye la asignación de asientos
export const assignSeatsToPassengers = async (passengers, airplaneId) => {
  try {
    console.log(`Iniciando asignación de asientos para avión ${airplaneId}`);
    
    // OBTENER INFORMACIÓN DEL AVIÓN Y SUS ASIENTOS
    const [seats] = await pool.execute(`
      SELECT s.seat_id, s.seat_row, s.seat_column, s.seat_type_id, st.name as seat_type_name
      FROM seat s
      JOIN seat_type st ON s.seat_type_id = st.seat_type_id
      WHERE s.airplane_id = ?
      ORDER BY s.seat_row, s.seat_column
    `, [airplaneId]);

    if (seats.length === 0) {
      throw new Error(`No se encontraron asientos para el avión ${airplaneId}`);
    }

    //AGRUPAR PASAJEROS POR COMPRA (purchase_id)
    const groups = {};
    passengers.forEach(passenger => {
      const purchaseId = passenger.purchase_id;
      if (!groups[purchaseId]) {
        groups[purchaseId] = [];
      }
      // Marcar si es menor de edad
      passenger.isMinor = passenger.age < 18;
      groups[purchaseId].push(passenger);
    });

    console.log(`Grupos encontrados: ${Object.keys(groups).length}`);

    // VERIFICAR REGLA DE MENORES ACOMPAÑADOS
    for (const groupId in groups) {
      const group = groups[groupId];
      const minors = group.filter(p => p.isMinor);
      const adults = group.filter(p => !p.isMinor);
      
      if (minors.length > 0 && adults.length === 0) {
        throw new Error(`Grupo ${groupId} tiene ${minors.length} menor(es) pero ningún adulto`);
      }
      
      console.log(`Grupo ${groupId}: ${adults.length} adultos, ${minors.length} menores`);
    }

    // PREPARAR ASIENTOS DISPONIBLES
    const availableSeats = {};
    seats.forEach(seat => {
      if (!availableSeats[seat.seat_type_id]) {
        availableSeats[seat.seat_type_id] = [];
      }
      availableSeats[seat.seat_type_id].push({
        seatId: seat.seat_id,
        row: seat.seat_row,
        column: seat.seat_column,
        typeId: seat.seat_type_id,
        typeName: seat.seat_type_name,
        assigned: false
      });
    });

    // ORDENAR GRUPOS POR PRIORIDAD (grupos con menores primero, luego grupos más grandes)
    const sortedGroupIds = Object.keys(groups).sort((a, b) => {
      const groupA = groups[a];
      const groupB = groups[b];
      
      // Prioridad 1: Grupos con menores
      const aHasMinors = groupA.some(p => p.isMinor);
      const bHasMinors = groupB.some(p => p.isMinor);
      if (aHasMinors && !bHasMinors) return -1;
      if (!aHasMinors && bHasMinors) return 1;
      
      // Prioridad 2: Grupos más grandes primero
      return groupB.length - groupA.length;
    });

    // ASIGNAR ASIENTOS A CADA GRUPO 
    for (const groupId of sortedGroupIds) {
      const group = groups[groupId];
      const seatTypeId = group[0].seat_type_id;
      
      console.log(`Asignando grupo ${groupId} (${group.length} personas, tipo asiento: ${seatTypeId})`);

      if (!availableSeats[seatTypeId] || availableSeats[seatTypeId].length < group.length) {
        throw new Error(`No hay suficientes asientos tipo ${seatTypeId} para el grupo ${groupId}`);
      }
console.log('Estrategia de asignación para grupo', groupId);
console.log('Asientos disponibles tipo', seatTypeId, ':', availableSeats[seatTypeId].length);

      let assignedSeats = null;
      
      // Intento 1: Buscar asientos contiguos en la misma fila
      assignedSeats = findContiguousSeatsInRow(availableSeats[seatTypeId], group.length);
      console.log('Intento 1 - Contiguos en misma fila:', assignedSeats ? 'ÉXITO' : 'FALLÓ');
      // Intento 2: Si no encuentra, buscar asientos en filas adyacentes
      if (!assignedSeats && group.length > 1) {
        assignedSeats = findNearbySeats(availableSeats[seatTypeId], group.length);
         console.log('Intento 2 - Filas ayacentes:', assignedSeats ? 'ÉXITO' : 'FALLÓ');
      }
      
      // Intento 3: Si sigue sin encontrar, asignar los más cercanos posibles 
      //Estoy cansado hermano
      if (!assignedSeats) {
        assignedSeats = findClosestSeats(availableSeats[seatTypeId], group.length);
        console.log('Intento 3 - Asientos cercanos:', assignedSeats ? 'ÉXITO' : 'FALLÓ');
      }
console.log('Asientos asignados al grupo:', assignedSeats);
      if (assignedSeats) {
        // Asignar asientos encontrados al grupo
        for (let i = 0; i < group.length; i++) {
          group[i].seat_id = assignedSeats[i].seatId;
          // Marcar asiento como ocupado
          const seatIndex = availableSeats[seatTypeId].findIndex(s => s.seatId === assignedSeats[i].seatId);
          if (seatIndex !== -1) {
            availableSeats[seatTypeId].splice(seatIndex, 1);
          }
        }
        console.log(`✓ Grupo ${groupId} asignado: ${assignedSeats.map(s => `${s.row}${s.column}`).join(', ')}`);
      } else {
        // Último recurso: asignación individual
        console.log(`⚠ Asignando individualmente al grupo ${groupId}`);
        for (const passenger of group) {
          if (availableSeats[seatTypeId].length > 0) {
            passenger.seat_id = availableSeats[seatTypeId][0].seatId;
            availableSeats[seatTypeId].shift();
          }
        }
      }
    }

    console.log('Asignación de asientos completada exitosamente');
    return passengers;

  } catch (error) {
    console.error('Error en asignación de asientos:', error);
    throw error;
  }
};

// Función auxiliar para encontrar asientos contiguos en misma fila
const findContiguousSeatsInRow = (availableSeats, groupSize) => {
  if (groupSize === 1) {
    return [availableSeats[0]]; // Para una persona, cualquier asiento disponible
  }

  // Agrupar asientos por fila
  const seatsByRow = {};
  availableSeats.forEach(seat => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  // Buscar en cada fila
  for (const row in seatsByRow) {
    const rowSeats = seatsByRow[row];
    
    // Ordenar asientos por columna
    rowSeats.sort((a, b) => a.column.localeCompare(b.column));
    
    // Buscar bloque contiguo del tamaño necesario
    for (let i = 0; i <= rowSeats.length - groupSize; i++) {
      const block = rowSeats.slice(i, i + groupSize);
      
      // Verificar si el bloque es contiguo
      if (isSeatBlockContiguous(block)) {
        return block;
      }
    }
  }
  
  return null; // No se encontraron asientos contiguos
};

// Verificar si los asientos son contiguos
const isSeatBlockContiguous = (seats) => {
  for (let i = 1; i < seats.length; i++) {
    const currentCol = seats[i].column.charCodeAt(0);
    const prevCol = seats[i-1].column.charCodeAt(0);
    
    if (currentCol - prevCol !== 1) {
      return false;
    }
  }
  return true;
};

// Buscar asientos cercanos (misma fila o filas adyacentes)
const findNearbySeats = (availableSeats, groupSize) => {
  // Agrupar por fila y ordenar filas
  const seatsByRow = {};
  availableSeats.forEach(seat => {
    if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
    seatsByRow[seat.row].push(seat);
  });
  
  const rows = Object.keys(seatsByRow).map(Number).sort((a, b) => a - b);
  
  // Buscar en filas consecutivas
  for (let i = 0; i <= rows.length - 2; i++) {
    const currentRow = rows[i];
    const nextRow = rows[i + 1];
    
    const currentRowSeats = seatsByRow[currentRow];
    const nextRowSeats = seatsByRow[nextRow];
    
    if (currentRowSeats && nextRowSeats) {
      // Intentar dividir el grupo entre dos filas adyacentes
      for (let split = 1; split < groupSize; split++) {
        const firstPart = currentRowSeats.slice(0, split);
        const secondPart = nextRowSeats.slice(0, groupSize - split);
        
        if (firstPart.length >= split && secondPart.length >= groupSize - split) {
          return [...firstPart.slice(0, split), ...secondPart.slice(0, groupSize - split)];
        }
      }
    }
  }
  
  return null;
};

// Buscar los asientos más cercanos posibles
const findClosestSeats = (availableSeats, groupSize) => {
  if (availableSeats.length < groupSize) return null;
  
  // Ordenar asientos por fila y columna
  const sortedSeats = [...availableSeats].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.column.localeCompare(b.column);
  });
  
  // Encontrar el grupo de asientos más compacto
  let bestGroup = null;
  let minDistance = Infinity;
  
  for (let i = 0; i <= sortedSeats.length - groupSize; i++) {
    const group = sortedSeats.slice(i, i + groupSize);
    const distance = calculateGroupDistance(group);
    
    if (distance < minDistance) {
      minDistance = distance;
      bestGroup = group;
    }
  }
  
  return bestGroup;
};

// Calcular "distancia" total entre asientos de un grupo
const calculateGroupDistance = (seats) => {
  let totalDistance = 0;
  for (let i = 1; i < seats.length; i++) {
    const rowDiff = Math.abs(seats[i].row - seats[i-1].row);
    const colDiff = Math.abs(seats[i].column.charCodeAt(0) - seats[i-1].column.charCodeAt(0));
    totalDistance += rowDiff * 10 + colDiff; // Pesar más la diferencia de filas
  }
  return totalDistance;
};
