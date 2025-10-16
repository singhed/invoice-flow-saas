import { useState, useEffect } from 'react';
import { reportsApi } from '../api/reports';
import {
  MonthlyIncomeData,
  OutstandingBalance,
  TopClient,
  EstimatedTaxes,
  Client,
} from '../types';
import MonthlyIncomeChart from './MonthlyIncomeChart';
import OutstandingBalancesChart from './OutstandingBalancesChart';
import TopClientsChart from './TopClientsChart';
import EstimatedTaxesCard from './EstimatedTaxesCard';
import Filters from './Filters';
import LoadingSpinner from './LoadingSpinner';
import './Dashboard.css';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncomeData[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalance | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [estimatedTaxes, setEstimatedTaxes] = useState<EstimatedTaxes | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    clientId: '' as string,
    taxYear: new Date().getFullYear(),
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadClients = async () => {
    try {
      const data = await reportsApi.getClients();
      setClients(data);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const startDate = filters.startDate?.toISOString().split('T')[0];
      const endDate = filters.endDate?.toISOString().split('T')[0];

      const [income, balances, topClientsData, taxes] = await Promise.all([
        reportsApi.getMonthlyIncome(startDate, endDate),
        reportsApi.getOutstandingBalances(filters.clientId || undefined),
        reportsApi.getTopClients(10, startDate, endDate),
        reportsApi.getEstimatedTaxes(filters.taxYear),
      ]);

      setMonthlyIncome(income);
      setOutstandingBalances(balances);
      setTopClients(topClientsData);
      setEstimatedTaxes(taxes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (loading && monthlyIncome.length === 0) {
    return (
      <div className="dashboard">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && monthlyIncome.length === 0) {
    return (
      <div className="dashboard">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Filters
        filters={filters}
        clients={clients}
        onFilterChange={handleFilterChange}
      />

      {loading && <LoadingSpinner overlay />}

      <div className="dashboard-grid">
        <div className="dashboard-card full-width">
          <h2>Monthly Income</h2>
          <MonthlyIncomeChart data={monthlyIncome} />
        </div>

        <div className="dashboard-card">
          <h2>Outstanding Balances</h2>
          {outstandingBalances && (
            <OutstandingBalancesChart data={outstandingBalances} />
          )}
        </div>

        <div className="dashboard-card">
          <h2>Top Clients</h2>
          <TopClientsChart data={topClients} />
        </div>

        <div className="dashboard-card full-width">
          <h2>Estimated Taxes</h2>
          {estimatedTaxes && <EstimatedTaxesCard data={estimatedTaxes} />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
