type StatusCardProps = {
  message: string;
};

export function StatusCard({ message }: StatusCardProps) {
  return <output aria-live="polite">{message}</output>;
}
