# Documentación de OXO Smart Contract

## Descripción General

El proyecto OXO Smart Contract implementa un sistema de distribución y reclamación de tokens basado en Ethereum, diseñado para distribuir el token OXS a usuarios elegibles a lo largo del tiempo. El sistema utiliza un mecanismo de distribución logarítmica semanal que incentiva la participación a largo plazo.

## Características Principales

- **Distribución Logarítmica**: Distribución semanal de tokens basada en una fórmula logarítmica.
- **Sistema de Pesos**: Los usuarios tienen un peso calculado en base a su cantidad stakeada, productividad y duración de bloqueo.
- **Reclamación de Tokens**: Los usuarios pueden reclamar tokens semanalmente según su peso relativo.
- **Arquitectura Modular**: Diseño modular que separa las diferentes funcionalidades en componentes independientes.
- **Protecciones de Seguridad**: Implementación de guardas contra reentrancia, manipulación temporal y otras vulnerabilidades.

## Estructura del Proyecto

El proyecto está organizado en los siguientes directorios:

- `/contracts`: Contiene todos los contratos inteligentes del sistema.
  - `/interfaces`: Interfaces que definen las funcionalidades principales.
  - `/libraries`: Bibliotecas de utilidades para cálculos matemáticos y temporales.
  - `/modules`: Componentes modulares que implementan las diferentes funcionalidades.
  - `/token`: Implementación principal del token OXS.

## Documentación Disponible

- [Documentación Técnica](./technical): Documentación detallada para desarrolladores.
- [Documentación de Usuario](./user): Guías y tutoriales para usuarios finales.
- [Verificación Formal](./verification.md): Análisis formal de seguridad y verificación de invariantes.
- [Checklist de Seguridad](./security-checklist.md): Lista de verificación de seguridad para auditorías.

## Licencia

Este proyecto está licenciado bajo la licencia MIT. 