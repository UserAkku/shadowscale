"use client";

import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'];

export default function AnalyticsCharts({ data }: { data: any }) {
  // Helper to check if data array is valid and not empty
  const hasData = (arr: any[]) => arr && arr.length > 0;

  // Fallback UI for empty charts
  const renderEmpty = () => (
    <div className="flex flex-col h-full items-center justify-center text-center font-mono text-gray-500 uppercase">
      <span className="text-sm font-bold text-black">No Data Available</span>
      <span className="text-xs mt-2 opacity-70">(Refresh after 30s if you just clicked the link)</span>
    </div>
  );

  // Ensure counts are numbers (PostgreSQL COUNT() returns strings which breaks PieChart)
  const safeDevices = data.devices?.map((d: any) => ({ ...d, count: Number(d.count) })) || [];
  const safeBrowsers = data.browsers?.map((d: any) => ({ ...d, count: Number(d.count) })) || [];
  const safeCountries = data.topCountries?.map((d: any) => ({ ...d, count: Number(d.count) })) || [];
  const safeHourly = data.hourlyData?.map((d: any) => ({ ...d, clicks: Number(d.clicks) })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. HOURLY CLICKS: Area Chart (Trendline with gradient) */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Hourly Clicks Trend (Last 24h)</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          {hasData(safeHourly) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeHourly} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(tick) => `${tick}:00`} 
                  tick={{ fontFamily: 'monospace', fontSize: 12 }} 
                  label={{ 
                    value: 'TIME OF DAY (HOURS)', 
                    position: 'insideBottom', 
                    offset: -20, 
                    fontFamily: 'monospace', 
                    fontSize: 12, 
                    fontWeight: 'bold' 
                  }} 
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontFamily: 'monospace', fontSize: 12 }} 
                  label={{ 
                    value: 'TOTAL CLICKS', 
                    angle: -90, 
                    position: 'insideLeft', 
                    offset: 15, 
                    fontFamily: 'monospace', 
                    fontSize: 12, 
                    fontWeight: 'bold' 
                  }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 0, border: '2px solid black', backgroundColor: '#fff', textTransform: 'uppercase', fontWeight: 'bold' }} 
                  labelFormatter={(label) => `Time: ${label}:00`}
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#000" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorClicks)" 
                  activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : renderEmpty()}
        </CardContent>
      </Card>

      {/* 2. DEVICES: Doughnut Chart (Pie with inner radius) */}
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {hasData(safeDevices) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={safeDevices}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="device"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#000', strokeWidth: 1 }}
                >
                  {safeDevices.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 0, border: '2px solid black', backgroundColor: '#fff', textTransform: 'uppercase', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : renderEmpty()}
        </CardContent>
      </Card>

      {/* 3. TOP COUNTRIES: Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Countries</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {hasData(safeCountries) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeCountries} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                <XAxis 
                  type="number" 
                  allowDecimals={false} 
                  tick={{ fontFamily: 'monospace', fontSize: 12 }} 
                  label={{ 
                    value: 'NUMBER OF CLICKS', 
                    position: 'insideBottom', 
                    offset: -20, 
                    fontFamily: 'monospace', 
                    fontSize: 12, 
                    fontWeight: 'bold' 
                  }} 
                />
                <YAxis 
                  dataKey="country" 
                  type="category" 
                  tick={{ fontFamily: 'monospace', fontSize: 12 }} 
                  label={{ 
                    value: 'COUNTRY', 
                    angle: -90, 
                    position: 'insideLeft', 
                    offset: 15, 
                    fontFamily: 'monospace', 
                    fontSize: 12, 
                    fontWeight: 'bold' 
                  }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 0, border: '2px solid black', backgroundColor: '#fff', textTransform: 'uppercase', fontWeight: 'bold' }} 
                  cursor={{ fill: '#f0f0f0' }} 
                />
                <Bar dataKey="count" fill="#000" barSize={30} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : renderEmpty()}
        </CardContent>
      </Card>

      {/* 4. TOP BROWSERS: Solid Pie Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Browser Market Share</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          {hasData(safeBrowsers) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={safeBrowsers}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="count"
                  nameKey="browser"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#000', strokeWidth: 1 }}
                >
                  {safeBrowsers.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 0, border: '2px solid black', backgroundColor: '#fff', textTransform: 'uppercase', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : renderEmpty()}
        </CardContent>
      </Card>
      
    </div>
  );
}
