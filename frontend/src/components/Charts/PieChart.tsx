import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = [
  'var(--color-accent-primary)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-success)',
  'var(--color-danger)',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

export function PieChart({ data, colors = DEFAULT_COLORS, height = 300 }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(props: any) => {
            const name = props.name ?? '';
            const percent = props.percent ?? 0;
            return `${name} ${(percent * 100).toFixed(0)}%`;
          }}
          outerRadius={80}
          fill="var(--color-accent-primary)"
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

