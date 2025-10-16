import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  overlay?: boolean;
}

function LoadingSpinner({ overlay = false }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner ${overlay ? 'overlay' : ''}`}>
      <div className="spinner"></div>
      <p>Loading data...</p>
    </div>
  );
}

export default LoadingSpinner;
