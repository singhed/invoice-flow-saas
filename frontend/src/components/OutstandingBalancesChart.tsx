import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { OutstandingBalance } from '../types';

interface OutstandingBalancesChartProps {
  data: OutstandingBalance;
}

const COLORS = {
  PENDING: '#fbbf24',
  PARTIALLY_PAID: '#f97316',
  OVERDUE: '#ef4444',
};

function OutstandingBalancesChart({ data }: OutstandingBalancesChartProps) {
  const chartData = data.byStatus.map(item => ({
    name: item.status.replace('_', ' '),
    value: Number(item.amount.toFixed(2)),
    count: item.count,
  }));

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Outstanding</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
          ${data.total.toFixed(2)}
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name.replace(' ', '_').toUpperCase() as keyof typeof COLORS] || '#cbd5e0'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div style={{ marginTop: '1rem' }}>
            {data.byStatus.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <span>{item.status.replace('_', ' ')}</span>
                <span>
                  <strong>${Number(item.amount).toFixed(2)}</strong> ({item.count} invoices)
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-data">No outstanding balances</div>
      )}
    </div>
  );
}

export default OutstandingBalancesChart;
