'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from 'recharts'
import { IWidget, TipoGrafica } from '@/services/dashboard.service'
import { WidgetWrapper } from './WidgetWrapper'
import { formatCurrency } from '@/lib/utils'

interface ChartWidgetProps {
  widget: IWidget
  data: any[] | null
  isLoading?: boolean
  error?: string
  titulo: string
  dataKeys: {
    key: string
    name: string
    color: string
    type?: 'line' | 'bar' | 'area'
  }[]
  xAxisKey?: string
  onRefresh?: () => void
  onConfigure?: () => void
  onRemove?: () => void
}

const COLORES_DEFAULT = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

export function ChartWidget({
  widget,
  data,
  isLoading,
  error,
  titulo,
  dataKeys,
  xAxisKey = 'fecha',
  onRefresh,
  onConfigure,
  onRemove,
}: ChartWidgetProps) {
  const tipoGrafica = widget.config.tipoGrafica || TipoGrafica.LINEA
  const mostrarLeyenda = widget.config.mostrarLeyenda !== false
  const mostrarEjes = widget.config.mostrarEjes !== false
  const colores = widget.config.colores || COLORES_DEFAULT

  const formatTooltip = (value: number) => {
    if (widget.config.formato === 'moneda') {
      return formatCurrency(value)
    }
    if (widget.config.formato === 'porcentaje') {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString('es-ES')
  }

  const formatXAxis = (value: string) => {
    if (!value) return ''
    // Si es una fecha ISO (formato: YYYY-MM-DD o con T para datetime)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}/
    if (typeof value === 'string' && isoDatePattern.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      }
    }
    // Truncar nombres largos
    if (typeof value === 'string' && value.length > 15) {
      return value.substring(0, 12) + '...'
    }
    return String(value)
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toString()
  }

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Sin datos disponibles
        </div>
      )
    }

    switch (tipoGrafica) {
      case TipoGrafica.LINEA:
        return (
          <LineChart data={data}>
            {mostrarEjes && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} tickFormatter={formatXAxis} />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip formatter={formatTooltip} labelFormatter={formatXAxis} />
            {mostrarLeyenda && <Legend />}
            {dataKeys.map((dk, i) => (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color || colores[i % colores.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        )

      case TipoGrafica.AREA:
        return (
          <AreaChart data={data}>
            {mostrarEjes && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} tickFormatter={formatXAxis} />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip formatter={formatTooltip} labelFormatter={formatXAxis} />
            {mostrarLeyenda && <Legend />}
            {dataKeys.map((dk, i) => (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color || colores[i % colores.length]}
                fill={`${dk.color || colores[i % colores.length]}20`}
              />
            ))}
          </AreaChart>
        )

      case TipoGrafica.BARRA:
      case TipoGrafica.BARRAS_HORIZONTALES:
        return (
          <BarChart
            data={data}
            layout={tipoGrafica === TipoGrafica.BARRAS_HORIZONTALES ? 'vertical' : 'horizontal'}
          >
            {mostrarEjes && <CartesianGrid strokeDasharray="3 3" />}
            {tipoGrafica === TipoGrafica.BARRAS_HORIZONTALES ? (
              <>
                <XAxis type="number" tickFormatter={formatYAxis} />
                <YAxis dataKey={xAxisKey} type="category" width={100} />
              </>
            ) : (
              <>
                <XAxis dataKey={xAxisKey} tickFormatter={formatXAxis} />
                <YAxis tickFormatter={formatYAxis} />
              </>
            )}
            <Tooltip formatter={formatTooltip} />
            {mostrarLeyenda && <Legend />}
            {dataKeys.map((dk, i) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.name}
                fill={dk.color || colores[i % colores.length]}
              />
            ))}
          </BarChart>
        )

      case TipoGrafica.CIRCULAR:
      case TipoGrafica.DONA:
        const pieKey = dataKeys[0]?.key || 'value'
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={tipoGrafica === TipoGrafica.DONA ? '60%' : 0}
              outerRadius="80%"
              paddingAngle={2}
              dataKey={pieKey}
              nameKey="name"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colores[index % colores.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            {mostrarLeyenda && <Legend />}
          </PieChart>
        )

      case TipoGrafica.COMBINADO:
        return (
          <ComposedChart data={data}>
            {mostrarEjes && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} tickFormatter={formatXAxis} />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip formatter={formatTooltip} labelFormatter={formatXAxis} />
            {mostrarLeyenda && <Legend />}
            {dataKeys.map((dk, i) => {
              const color = dk.color || colores[i % colores.length]
              switch (dk.type) {
                case 'bar':
                  return (
                    <Bar key={dk.key} dataKey={dk.key} name={dk.name} fill={color} />
                  )
                case 'area':
                  return (
                    <Area
                      key={dk.key}
                      type="monotone"
                      dataKey={dk.key}
                      name={dk.name}
                      stroke={color}
                      fill={`${color}20`}
                    />
                  )
                case 'line':
                default:
                  return (
                    <Line
                      key={dk.key}
                      type="monotone"
                      dataKey={dk.key}
                      name={dk.name}
                      stroke={color}
                      strokeWidth={2}
                    />
                  )
              }
            })}
          </ComposedChart>
        )

      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" />
          </LineChart>
        )
    }
  }

  return (
    <WidgetWrapper
      widget={widget}
      titulo={titulo}
      isLoading={isLoading}
      error={error}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      onRemove={onRemove}
    >
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </WidgetWrapper>
  )
}
