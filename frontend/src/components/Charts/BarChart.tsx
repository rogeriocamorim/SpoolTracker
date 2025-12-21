import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: Array<{ name: string; value: number; [key: string]: string | number }>;
  dataKey: string;
  color?: string;
  height?: number;
}

export function BarChart({ data, dataKey, color = 'var(--color-accent-primary)', height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis 
          dataKey="name" 
          stroke="var(--color-text-secondary)"
          style={{ fontSize: '0.75rem' }}
        />
        <YAxis 
          stroke="var(--color-text-secondary)"
          style={{ fontSize: '0.75rem' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
          }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

