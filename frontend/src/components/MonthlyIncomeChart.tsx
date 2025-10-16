import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyIncomeData } from '../types';
import { format, parseISO } from 'date-fns';

interface MonthlyIncomeChartProps {
  data: MonthlyIncomeData[];
}

function MonthlyIncomeChart({ data }: MonthlyIncomeChartProps) {
  if (data.length === 0) {
    return <div className="no-data">No data available</div>;
  }

  const formattedData = data.map(item => ({
    ...item,
    monthLabel: format(parseISO(item.month + '-01'), 'MMM yyyy'),
    income: Number(item.income.toFixed(2)),
  }));

  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const averageIncome = totalIncome / data.length;

  return (
    <div>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Income</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
            ${totalIncome.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>Average Monthly</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#48bb78' }}>
            ${averageIncome.toFixed(2)}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Income']}
          />
          <Legend />
          <Bar dataKey="income" fill="#667eea" name="Monthly Income" />
        </BarChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={200} style={{ marginTop: '2rem' }}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="invoiceCount"
            stroke="#48bb78"
            strokeWidth={2}
            name="Invoice Count"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyIncomeChart;
