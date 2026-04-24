"use client";

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'];

export default function AnalyticsCharts({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Hourly Clicks (Last 24h)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.hourlyData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} tick={{ fontFamily: 'monospace' }} />
              <YAxis allowDecimals={false} tick={{ fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ borderRadius: 0, border: '2px solid black', backgroundColor: '#e8e8e8', textTransform: 'uppercase', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="clicks" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.devices}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="count"
                nameKey="device"
              >
                {data.devices?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 0, border: '2px solid black', backgroundColor: '#e8e8e8', textTransform: 'uppercase', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Countries</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topCountries} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontFamily: 'monospace', fontSize: 12 }} />
              <YAxis dataKey="country" type="category" tick={{ fontFamily: 'monospace', fontSize: 12 }} width={70} />
              <Tooltip contentStyle={{ borderRadius: 0, border: '2px solid black', backgroundColor: '#e8e8e8', textTransform: 'uppercase', fontWeight: 'bold' }} />
              <Bar dataKey="count" fill="#000" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Top Browsers</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.browsers} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
              <XAxis dataKey="browser" tick={{ fontFamily: 'monospace', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontFamily: 'monospace', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 0, border: '2px solid black', backgroundColor: '#e8e8e8', textTransform: 'uppercase', fontWeight: 'bold' }} cursor={{ fill: '#d0d0d0' }} />
              <Bar dataKey="count" fill="#000" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
