import { Router } from 'express';
import {
  getAllTurnosServicio,
  getTurnosServicioActivos,
  getTurnoServicioById,
  createTurnoServicio,
  updateTurnoServicio,
  deleteTurnoServicio,
} from './turnos-servicio.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware, requireBusinessDatabase } from '../../middleware/tenant.middleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireBusinessDatabase);

router.get('/', getAllTurnosServicio);
router.get('/activos', getTurnosServicioActivos);
router.get('/:id', getTurnoServicioById);
router.post('/', createTurnoServicio);
router.put('/:id', updateTurnoServicio);
router.delete('/:id', deleteTurnoServicio);

export default router;
