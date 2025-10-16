import { Router } from 'express';
import { reportService } from '../services/reportService';

const router = Router();

router.get('/monthly-income', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getMonthlyIncome(
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching monthly income:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monthly income' });
  }
});

router.get('/outstanding-balances', async (req, res) => {
  try {
    const { clientId } = req.query;
    const data = await reportService.getOutstandingBalances(clientId as string | undefined);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching outstanding balances:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch outstanding balances' });
  }
});

router.get('/top-clients', async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;
    const data = await reportService.getTopClients(
      limit ? parseInt(limit as string) : 10,
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching top clients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top clients' });
  }
});

router.get('/estimated-taxes', async (req, res) => {
  try {
    const { year } = req.query;
    const data = await reportService.getEstimatedTaxes(
      year ? parseInt(year as string) : undefined
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching estimated taxes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch estimated taxes' });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const data = await reportService.getClients();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

router.post('/clear-cache', async (req, res) => {
  try {
    reportService.clearCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cache' });
  }
});

export default router;
