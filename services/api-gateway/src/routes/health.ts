import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    service: 'api-gateway',
  });
});

router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    service: 'api-gateway',
  });
});

export default router;
