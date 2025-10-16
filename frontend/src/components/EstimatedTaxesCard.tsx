import { EstimatedTaxes } from '../types';
import './EstimatedTaxesCard.css';

interface EstimatedTaxesCardProps {
  data: EstimatedTaxes;
}

function EstimatedTaxesCard({ data }: EstimatedTaxesCardProps) {
  const netIncome = data.totalIncome - data.estimatedTaxLiability;
  const taxPercentage = (data.taxRate * 100).toFixed(0);

  return (
    <div className="tax-card">
      <div className="tax-year">Year: {data.year}</div>

      <div className="tax-grid">
        <div className="tax-item">
          <div className="tax-label">Total Income</div>
          <div className="tax-value income">
            ${data.totalIncome.toFixed(2)}
          </div>
        </div>

        <div className="tax-item">
          <div className="tax-label">Tax Collected from Clients</div>
          <div className="tax-value collected">
            ${data.totalTaxCollected.toFixed(2)}
          </div>
        </div>

        <div className="tax-item">
          <div className="tax-label">Estimated Tax Liability ({taxPercentage}%)</div>
          <div className="tax-value liability">
            ${data.estimatedTaxLiability.toFixed(2)}
          </div>
        </div>

        <div className="tax-item">
          <div className="tax-label">Net Income (After Taxes)</div>
          <div className="tax-value net">
            ${netIncome.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="tax-breakdown">
        <h3>Tax Breakdown</h3>
        <div className="breakdown-bar">
          <div
            className="breakdown-segment net-segment"
            style={{
              width: `${(netIncome / data.totalIncome * 100).toFixed(2)}%`,
            }}
          >
            Net: {(netIncome / data.totalIncome * 100).toFixed(1)}%
          </div>
          <div
            className="breakdown-segment tax-segment"
            style={{
              width: `${(data.estimatedTaxLiability / data.totalIncome * 100).toFixed(2)}%`,
            }}
          >
            Tax: {(data.estimatedTaxLiability / data.totalIncome * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="tax-note">
        <strong>Note:</strong> This is an estimate based on a {taxPercentage}% tax rate.
        Consult with a tax professional for accurate tax calculations.
      </div>
    </div>
  );
}

export default EstimatedTaxesCard;
