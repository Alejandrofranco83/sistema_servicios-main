"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Iniciando datos de prueba para IPS...');
        // 1. Obtener algunas personas de tipo 'Funcionario' o 'Vip'
        const personas = yield prisma.persona.findMany({
            where: {
                OR: [
                    { tipo: 'Funcionario' },
                    { tipo: 'Vip' },
                    { tipo: 'funcionario' },
                    { tipo: 'vip' }
                ]
            },
            take: 5 // Limitar a 5 personas
        });
        if (personas.length === 0) {
            console.log('No se encontraron personas de tipo Funcionario o Vip. Creando algunas...');
            // Crear algunas personas de ejemplo si no existen
            const personasEjemplo = [
                {
                    nombreCompleto: 'JUAN PEREZ',
                    documento: '1234567',
                    tipo: 'Funcionario',
                    telefono: '0981123456'
                },
                {
                    nombreCompleto: 'MARIA GONZALEZ',
                    documento: '2345678',
                    tipo: 'Funcionario',
                    telefono: '0981234567'
                },
                {
                    nombreCompleto: 'CARLOS RODRIGUEZ',
                    documento: '3456789',
                    tipo: 'Vip',
                    telefono: '0982345678'
                }
            ];
            for (const persona of personasEjemplo) {
                try {
                    // Verificar si la persona ya existe
                    const existente = yield prisma.persona.findUnique({
                        where: { documento: persona.documento }
                    });
                    if (!existente) {
                        yield prisma.persona.create({
                            data: persona
                        });
                        console.log(`Persona creada: ${persona.nombreCompleto}`);
                    }
                    else {
                        console.log(`Persona ya existe: ${persona.nombreCompleto}`);
                    }
                }
                catch (error) {
                    console.error(`Error al crear persona ${persona.nombreCompleto}:`, error);
                }
            }
            // Obtener las personas recién creadas
            const personasCreadas = yield prisma.persona.findMany({
                where: {
                    OR: [
                        { tipo: 'Funcionario' },
                        { tipo: 'Vip' },
                        { tipo: 'funcionario' },
                        { tipo: 'vip' }
                    ]
                },
                take: 5
            });
            if (personasCreadas.length > 0) {
                personas.push(...personasCreadas);
            }
        }
        // 2. Registrar personas en IPS si no están registradas ya
        for (const persona of personas) {
            try {
                // Verificar si ya está registrada en IPS
                const existeIPS = yield prisma.personaIPS.findFirst({
                    where: { personaId: persona.id }
                });
                if (!existeIPS) {
                    // Crear registro en IPS
                    const fechaInicio = new Date();
                    fechaInicio.setMonth(fechaInicio.getMonth() - Math.floor(Math.random() * 12)); // Fecha aleatoria en el último año
                    yield prisma.personaIPS.create({
                        data: {
                            personaId: persona.id,
                            fechaInicio,
                            estado: 'ACTIVO'
                        }
                    });
                    console.log(`Persona registrada en IPS: ${persona.nombreCompleto}`);
                }
                else {
                    console.log(`Persona ya registrada en IPS: ${persona.nombreCompleto}`);
                }
            }
            catch (error) {
                console.error(`Error al registrar en IPS a ${persona.nombreCompleto}:`, error);
            }
        }
        console.log('Datos de prueba para IPS creados con éxito.');
    });
}
main()
    .catch((e) => {
    console.error('Error en el script de datos de prueba:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
//# sourceMappingURL=seed-ips.js.map