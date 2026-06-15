import "./loadingSpinner.css";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
}

export default function LoadingSpinner({
  size = "large",
  color = "#0066B3",
}: LoadingSpinnerProps) {
  return (
    <div className={`spinner ${size}`} style={{ borderTopColor: color }} />
  );
}