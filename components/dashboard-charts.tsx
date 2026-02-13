"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart
} from 'recharts';
import { MonthlyFinancials } from "@/lib/dashboard-calculations";

const formatSEK = (value: number) => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value);
};

const getMonthName = (monthStr: string) => {
  const date = new Date(`${monthStr}-01`);
  return date.toLocaleString('sv-SE', { month: 'short' }).replace('.', '');
};

export function DashboardCharts({ data }: { data: MonthlyFinancials[] }) {
  const chartData = data.map(d => ({
    name: getMonthName(d.month),
    fullName: new Date(`${d.month}-01`).toLocaleString('sv-SE', { month: 'long' }),
    Intäkt: d.revenue,
    Lönekostnad: d.salaryCost,
    Resultat: d.profit
  }));

  const totals = data.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    cost: acc.cost + curr.salaryCost,
    profit: acc.profit + curr.profit
  }), { revenue: 0, cost: 0, profit: 0 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-500">Prognostiserad Intäkt (Helår)</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{formatSEK(totals.revenue)} SEK</div>
           </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-500">Total Lönekostnad (Helår)</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{formatSEK(totals.cost)} SEK</div>
           </CardContent>
        </Card>
        <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-gray-500">Estimerat Resultat (Helår)</CardTitle>
           </CardHeader>
           <CardContent>
             <div className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-[var(--chart-3)]' : 'text-red-600'}`}>
               {formatSEK(totals.profit)} SEK
             </div>
           </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Ekonomisk Översikt 2026</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                    formatter={(value: number | undefined) => formatSEK(value ?? 0) + " kr"}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.fullName;
                      }
                      return label;
                    }}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
                />
                <Legend />
                <Bar dataKey="Intäkt" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Lönekostnad" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="Resultat" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 4, fill: 'var(--chart-3)' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
