import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import { BarChart3, Receipt, ListChecks, Laptop, Target } from 'lucide-react';
import { Panel, Loading, ErrorNote, EmptyState, useFetch, fmtMoney } from './ui';

// Chart tokens. Single-series charts use the brand primary; charts whose bars *mean* a state
// use the status set below (validated for CVD with dataviz/validate_palette.js; each bar also
// carries an axis label and a direct value label, so identity never relies on color alone).
const SERIES = '#34566F';
const STATUS_FILL = {
    Paid: '#1E7A4E', Completed: '#1E7A4E', Won: '#1E7A4E',
    Pending: '#D99A00', 'In Progress': '#D99A00', Proposal: '#D99A00',
    Overdue: '#B3261E', Lost: '#B3261E'
};
const NEUTRAL = '#98A0AA';
const GRID = '#ECEAE2';
const AXIS = { stroke: 'transparent', tick: { fill: '#5B6573', fontSize: 12 }, tickLine: false };

function ChartTooltip({ active, payload, label, format = v => v, name }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.45rem 0.65rem', boxShadow: 'var(--shadow-md)', fontSize: 12 }}>
            <div className="strong">{label ?? payload[0].payload.label}</div>
            <div className="muted">{name}: <span className="mono" style={{ color: 'var(--text-main)' }}>{format(payload[0].value)}</span></div>
        </div>
    );
}

// Horizontal bar chart: long category names stay readable and values sit at bar ends.
function HBar({ data, dataKey, labelKey, format = v => v, name, colorFor, height }) {
    if (!data?.length) return <EmptyState title="No data yet" />;
    return (
        <div style={{ height: height || Math.max(160, data.length * 44 + 20) }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, left: 4, bottom: 4 }} barCategoryGap={10}>
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" hide domain={[0, 'dataMax']} />
                    <YAxis type="category" dataKey={labelKey} width={150} {...AXIS} />
                    <Tooltip cursor={{ fill: 'rgba(52,86,111,0.06)' }} content={<ChartTooltip format={format} name={name} />} />
                    <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={22} fill={SERIES}>
                        {colorFor && data.map((d, i) => <Cell key={i} fill={colorFor(d)} />)}
                        <LabelList dataKey={dataKey} position="right" formatter={format} style={{ fill: '#1E2329', fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function AnalyticsCharts() {
    const { data: analytics, loading, error, reload } = useFetch('/api/query/analytics-summary', null);

    if (loading) return <Loading label="Aggregating analytics…" />;
    if (error) return <ErrorNote message={error} onRetry={reload} />;
    if (!analytics) return null;

    const { deptSalaries, invoiceSummary, taskStatus, assetCategory, leadPipeline = [] } = analytics;
    const byStatus = d => STATUS_FILL[d.status] || NEUTRAL;
    const money = v => fmtMoney(v);

    return (
        <div className="stack">
            <div className="grid-2">
                <Panel title="Average salary by department" subtitle={<>SQL <code>AVG(e.salary) … GROUP BY d.department_id</code></>} icon={BarChart3}>
                    <HBar data={[...deptSalaries].sort((a, b) => b.avg_salary - a.avg_salary)} dataKey="avg_salary" labelKey="department" format={money} name="Avg base salary" />
                </Panel>

                <Panel title="Invoice value by status" subtitle={<>SQL <code>SUM(amount) … GROUP BY status</code></>} icon={Receipt}>
                    <HBar data={invoiceSummary} dataKey="total_amount" labelKey="status" format={money} name="Billed" colorFor={byStatus} />
                </Panel>
            </div>

            <div className="grid-3">
                <Panel title="Tasks by status" subtitle={<>SQL <code>COUNT(task_id)</code></>} icon={ListChecks}>
                    <HBar data={taskStatus} dataKey="count" labelKey="status" name="Tasks" colorFor={byStatus} />
                </Panel>

                <Panel title="Sales pipeline" subtitle="Expected value per lead stage" icon={Target}>
                    <HBar data={leadPipeline} dataKey="value" labelKey="status" format={money} name="Expected value" colorFor={byStatus} />
                </Panel>

                <Panel title="Assets by category" subtitle={<>SQL <code>COUNT(asset_id)</code></>} icon={Laptop}>
                    <HBar data={[...assetCategory].sort((a, b) => b.count - a.count)} dataKey="count" labelKey="category" name="Assets" />
                </Panel>
            </div>
        </div>
    );
}
