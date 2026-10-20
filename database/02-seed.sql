-- Datos de prueba para desarrollo.
-- No son datos reales ni van a produccion; sirven para tener algo que
-- listar y filtrar mientras se construye la API y el frontend.

INSERT INTO users (nombre, email) VALUES
    ('Ana Lucía Morales', 'amorales@empresa.gt'),
    ('Carlos Estrada',    'cestrada@empresa.gt'),
    ('Sofía Ramírez',     'sramirez@empresa.gt');

INSERT INTO technicians (nombre, email, especialidad) VALUES
    ('Diego Herrera',  'dherrera@empresa.gt',  'Redes'),
    ('Marcela Pineda', 'mpineda@empresa.gt',   'Soporte de escritorio'),
    ('Luis Cardona',   'lcardona@empresa.gt',  'Servidores');

INSERT INTO incidents (titulo, descripcion, categoria, prioridad, estado, usuario_id, tecnico_id) VALUES
    ('No tengo internet en el tercer nivel',
     'Desde la mañana ninguna máquina del área de contabilidad conecta a la red.',
     'RED', 'CRITICA', 'EN_PROCESO', 1, 1),

    ('Excel se cierra solo al abrir reportes',
     'Al abrir el consolidado mensual la aplicación se cierra sin mensaje de error.',
     'SOFTWARE', 'MEDIA', 'ASIGNADO', 2, 2),

    ('Solicitud de acceso al sistema de planilla',
     'Necesito permisos de lectura para el módulo de planilla.',
     'ACCESOS', 'BAJA', 'NUEVO', 3, NULL);

INSERT INTO comments (incidente_id, autor, cuerpo) VALUES
    (1, 'Diego Herrera', 'Revisé el switch del tercer nivel, un puerto está caído. Voy a reemplazarlo.'),
    (1, 'Ana Lucía Morales', 'Gracias, avísenme cuando quede para probar.'),
    (2, 'Marcela Pineda', 'Pedí el archivo al usuario para reproducir el error en mi equipo.');
