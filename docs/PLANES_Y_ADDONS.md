# Estructura de Planes y Add-ons - Omerix ERP

## Planes Disponibles

| Plan | Precio/mes | Precio/año | Usuarios | Facturas/mes | Almacenamiento |
|------|------------|------------|----------|--------------|----------------|
| Demo | 0€ | 0€ | 5 | 100 | 2GB |
| Solo Fichaje | 15€ | 150€ | 10 | 0 | 1GB |
| Starter | 19€ | 190€ | 2 | 100 | 2GB |
| Basico | 35€ | 349€ | 10 | 200 | 5GB |
| Profesional | 99€ | 990€ | 30 | 1000 | 20GB |
| Enterprise | 249€ | 2490€ | Ilimitados | Ilimitadas | 100GB |

---

## Modulos Incluidos por Plan

### Demo (Trial gratuito - no visible en /planes)
- clientes, productos, ventas, compras, inventario, informes
- contabilidad, proyectos, crm, tpv, rrhh, restauracion
- tesoreria, calendarios
- **redes-sociales** (para pruebas)
- **google-calendar** (para pruebas)

### Solo Fichaje
- rrhh, calendarios

### Starter
- clientes, productos, ventas, informes

### Basico
- clientes, productos, ventas, compras, inventario, informes, tesoreria

### Profesional
- Todo lo de Basico +
- contabilidad, proyectos, crm, tpv, rrhh, tesoreria, calendarios
- api (documentacion API)

### Enterprise
- TODOS los modulos +
- restauracion, api, integraciones, soporte-prioritario
- **redes-sociales** (incluido)
- **google-calendar** (incluido)

---

## Add-ons Disponibles (BD)

### Modulos Extra
| Slug | Nombre | Precio/mes | Precio/año | Disponible para |
|------|--------|------------|------------|-----------------|
| redes-sociales | Redes Sociales | 15€ | 150€ | Todos menos Enterprise |
| google-calendar | Google Calendar | 5€ | 50€ | Todos menos Enterprise |
| contabilidad | Contabilidad | 15€ | 150€ | Starter, Basico |
| crm | CRM | 12€ | 120€ | Starter, Basico |
| proyectos | Proyectos | 10€ | 100€ | Starter, Basico |
| rrhh | RRHH | 12€ | 120€ | Starter, Basico |
| tpv | TPV (modulo) | 15€ | 150€ | Starter, Basico |
| tesoreria | Tesoreria | 8€ | 80€ | Starter, Basico |

### TPV Extra (cantidad variable)
| Slug | Nombre | Precio/mes | Precio/año | Max unidades |
|------|--------|------------|------------|--------------|
| tpv-extra | TPV Extra | 10€/TPV | 100€/TPV | 20 |

*El addon TPV Extra permite comprar multiples unidades (1-20) para añadir terminales adicionales.*

### Tokens IA
| Slug | Nombre | Precio/mes | Precio/año | Tokens |
|------|--------|------------|------------|--------|
| tokens-ia-5000 | Tokens IA 5000 | 5€ | 50€ | 5.000 |
| tokens-ia-20000 | Tokens IA 20000 | 15€ | 150€ | 20.000 |
| tokens-ia-50000 | Tokens IA 50000 | 30€ | 300€ | 50.000 |
| tokens-ia-ilimitados | Tokens IA Ilimitados | 99€ | 990€ | Ilimitados |

### Usuarios Extra
| Slug | Nombre | Precio/mes | Precio/año | Usuarios |
|------|--------|------------|------------|----------|
| usuarios-extra-5 | Pack 5 Usuarios | 10€ | 100€ | +5 |
| usuarios-extra-10 | Pack 10 Usuarios | 18€ | 180€ | +10 |

### Almacenamiento Extra
| Slug | Nombre | Precio/mes | Precio/año | GB |
|------|--------|------------|------------|-----|
| almacenamiento-extra-10gb | 10GB Extra | 5€ | 50€ | +10GB |

---

## Que puede contratar cada plan

### Solo Fichaje
- Puede añadir: usuarios-extra, almacenamiento, tokens-ia

### Starter
- Puede añadir: redes-sociales, google-calendar, usuarios-extra, almacenamiento, tokens-ia

### Basico
- Puede añadir: redes-sociales, google-calendar, usuarios-extra, almacenamiento, tokens-ia
- Puede comprar modulos: rrhh, tpv, proyectos, contabilidad, crm

### Profesional
- Puede añadir: redes-sociales, google-calendar, usuarios-extra, almacenamiento, tokens-ia, tpv-extra

### Enterprise
- Ya incluye todo
- Puede añadir: usuarios-extra (si necesita mas), almacenamiento, tokens-ia, tpv-extra

---

## Scripts de Base de Datos

```bash
# Crear/actualizar planes
npm run seed:plans

# Crear/actualizar addons
npm run seed:addons

# Procesar alertas de documentos (cron diario)
npm run alertas:documentos
```

---

## Endpoints API

```
GET  /api/licencias/planes     - Lista planes visibles
GET  /api/licencias/addons     - Lista add-ons disponibles
GET  /api/licencias/mi-licencia - Licencia actual de la empresa
POST /api/licencias/cambiar-plan - Cambiar de plan
POST /api/licencias/add-addon  - Añadir add-on a licencia
```

---

## Notas Importantes

1. **Plan Demo**: Solo para trials, no visible en la pagina de planes publica
2. **Enterprise**: Incluye redes-sociales y google-calendar por defecto
3. **Precios**: Todos con IVA incluido (21%)
4. **Descuento anual**: Aproximadamente 2 meses gratis (~17%)
5. **Tokens IA**: Se resetean mensualmente, no son acumulables
