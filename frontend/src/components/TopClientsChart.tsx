import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TopClient } from '../types';

interface TopClientsChartProps {
  data: TopClient[];
}

function TopClientsChart({ data }: TopClientsChartProps) {
  if (data.length === 0) {
    return <div className="no-data">No data available</div>;
  }

  const chartData = data.map(client => ({
    name: client.clientName,
    revenue: Number(client.totalRevenue.toFixed(2)),
    invoiceCount: client.invoiceCount,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'revenue') return [`$${value.toFixed(2)}`, 'Revenue'];
              return [value, 'Invoices'];
            }}
          />
          <Bar dataKey="revenue" fill="#667eea" name="Total Revenue" />
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Rank</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Client</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Revenue</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Invoices</th>
            </tr>
          </thead>
          <tbody>
            {data.map((client, index) => (
              <tr
                key={client.clientId}
                style={{ borderBottom: '1px solid #e2e8f0' }}
              >
                <td style={{ padding: '0.5rem' }}>#{index + 1}</td>
                <td style={{ padding: '0.5rem' }}>{client.clientName}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                  ${Number(client.totalRevenue).toFixed(2)}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {client.invoiceCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TopClientsChart;
