import type { Invoice, Product } from "../../types/commercial";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { categories } from "../../services/commercialConfig";
import { money } from "../../services/formatters";
import { stock } from "../inventario/inventarioServicio";

// Gráficos del tablero, separados de la pantalla principal.
export function SalesChart({ invoices }: { invoices: Invoice[] }) {
  const values = Array.from({ length: 7 }, (_, i) => {
    const d = "2026-10-" + (20 + i);
    return {
      name: 20 + i + " oct.",
      value: invoices
        .filter((x) => x.date === d && x.state !== "Anulada")
        .reduce((a, x) => a + x.total, 0),
    };
  });
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={values}
          margin={{ left: 0, right: 10, top: 15, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e9eef4"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#63748c" }}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 1e6 ? v / 1e6 + " M" : v / 1000 + " mil"
            }
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#63748c" }}
            width={48}
          />
          <Tooltip
            formatter={(v) => money(Number(v))}
            cursor={{ fill: "#f0f6fd" }}
          />
          <Bar
            isAnimationActive={false}
            dataKey="value"
            name="Ventas"
            fill="#0c88f7"
            radius={[3, 3, 0, 0]}
            maxBarSize={62}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Composition({
  products,
  warehouse,
}: {
  products: Product[];
  warehouse: string;
}) {
  const data = categories
    .map((name, i) => ({
      name,
      value: products
        .filter((p) => p.category === name)
        .reduce((a, p) => a + stock(p, warehouse) * p.cost, 0),
      color: palette[i],
    }))
    .filter((x) => x.value > 0);
  return (
    <div className="composition">
      <div className="donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={data}
              dataKey="value"
              innerRadius="63%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((x) => (
                <Cell key={x.name} fill={x.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => money(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <span>
          <b>{products.length}</b>
          <small>productos</small>
        </span>
      </div>
      <div className="legend">
        {data.slice(0, 5).map((x) => (
          <div key={x.name}>
            <span style={{ background: x.color }} />
            <b>{x.name}</b>
            <small>
              {Math.round(
                (x.value / data.reduce((a, x) => a + x.value, 0)) * 100,
              )}
              %
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export const palette = [
    "#0c88f7",
    "#0cafab",
    "#7c43d2",
    "#ff9a08",
    "#18bb66",
    "#ed4554",
    "#586f8e",
  ];
