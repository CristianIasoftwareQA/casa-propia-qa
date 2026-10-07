# Casa Propia — Insumos de la prueba técnica (Karate y Playwright)

Aplicación ejecutable localmente para la prueba de automatización QA. Las reglas de negocio son ficticias.

```
Insumos_Cristian_Karate_Playwright/
├── backend/    API REST (NestJS 11, TypeScript) — puerto 3000
├── frontend/   Pantalla del asesor (Angular 20) — puerto 4200
└── contrato/
    ├── openapi.yaml               Contrato de la API (reglas, códigos y errores)
    └── condiciones-simulacion.md  Proveedor con demora / no disponible y condición "jornada"
```

## Requisitos

- Node.js **20.19+** o **22.12+** (con npm). Comprueba con `node -v`.
- Puertos 3000 y 4200 libres.
- Para tus suites: JDK 17+ y Maven o Gradle (Karate) y Node.js (Playwright). La instalación y comprobación del entorno se hace **antes** de iniciar el cronómetro.

## Inicio de la aplicación

Usa dos terminales.

**1. API**

```bash
cd backend
npm install
npm start
```

Verás `Casa Propia API escuchando en http://localhost:3000/api`. Comprueba:

```bash
curl http://localhost:3000/api/salud
# {"estado":"OK","servicio":"casa-propia-api","version":"1.4.0"}
```

**2. Interfaz**

```bash
cd frontend
npm install
npm start
```

Abre http://localhost:4200. La interfaz reenvía `/api/*` a `http://localhost:3000` (ver `frontend/proxy.conf.json`), por lo que la API también responde en `http://localhost:4200/api`.

Para cambiar el puerto de la API: `PORT=3100 npm start` (y ajusta `frontend/proxy.conf.json`).

## Uso rápido de la API

```bash
# Registrar
curl -s -X POST http://localhost:3000/api/solicitudes \
  -H 'Content-Type: application/json' \
  -d '{"cliente":"Ana Gómez","valorVivienda":200000000,"monto":120000000,"plazoMeses":180}'

# Consultar
curl -s http://localhost:3000/api/solicitudes/SOL-000001

# Evaluar
curl -s -X POST http://localhost:3000/api/solicitudes/SOL-000001/evaluacion

# Registrar documentos
curl -s -X POST http://localhost:3000/api/solicitudes/SOL-000001/documentos \
  -H 'Content-Type: application/json' \
  -d '{"documentos":["CEDULA","CERTIFICADO_INGRESOS","AVALUO_VIVIENDA"]}'

# Confirmar
curl -s -X POST http://localhost:3000/api/solicitudes/SOL-000001/confirmacion
```

El detalle de reglas, estados y errores está en `contrato/openapi.yaml`; las condiciones de simulación, en `contrato/condiciones-simulacion.md`.

## Pantalla del asesor

Los elementos principales tienen atributos `data-testid` para facilitar la automatización:

| Elemento | `data-testid` |
|---|---|
| Campos de registro | `input-cliente`, `input-valor-vivienda`, `input-monto`, `select-plazo` |
| Registrar | `btn-registrar` · errores: `error-registro` |
| Consulta por número | `input-consulta`, `btn-consultar` |
| Número y estado | `id-solicitud`, `estado-solicitud` |
| Datos mostrados | `detalle-cliente`, `detalle-valor-vivienda`, `detalle-monto`, `detalle-plazo` |
| Motivo de rechazo | `razon-rechazo` |
| Documentos | `chk-CEDULA`, `chk-CERTIFICADO_INGRESOS`, `chk-AVALUO_VIVIENDA`, `btn-registrar-documentos`, `doc-<TIPO>` |
| Acciones | `btn-evaluar`, `btn-confirmar`, `btn-nueva` |
| Mensajes | `evaluacion-en-curso`, `aviso-demora`, `alerta-proveedor`, `resultado-evaluacion`, `aviso-confirmacion`, `error-accion` |

## Notas

- Los datos viven en memoria: reiniciar la API los borra. No hay datos precargados.
- No modifiques el código de `backend/` ni `frontend/`: el objeto de la prueba es verificar el producto tal como se entrega.
- Los importes se muestran en pantalla con formato de pesos colombianos (por ejemplo `$ 120.000.000`).
