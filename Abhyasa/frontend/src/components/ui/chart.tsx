import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used inside a ChartContainer");
  }
  return context;
}

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
};

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export function ChartStyle() {
  return null;
}

export const ChartTooltip = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

type ChartTooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: React.ReactNode;
  hideLabel?: boolean;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
}: ChartTooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className={cn("rounded-lg border bg-background p-2 text-sm shadow-sm", className)}>
      {!hideLabel && label ? (
        <div className="mb-1 font-medium">{label}</div>
      ) : null}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={`${item.dataKey ?? item.name ?? "item"}-${index}`} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{item.name ?? item.dataKey}</span>
            <span className="font-medium">{String(item.value ?? "")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ChartLegend = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

type ChartLegendContentProps = React.HTMLAttributes<HTMLDivElement> & {
  payload?: Array<{
    value?: string;
    color?: string;
    dataKey?: string;
  }>;
  verticalAlign?: "top" | "middle" | "bottom";
};

export function ChartLegendContent({
  payload,
  className,
}: ChartLegendContentProps) {
  if (!payload || payload.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {payload.map((item, index) => (
        <div key={`${item.dataKey ?? item.value ?? "legend"}-${index}`} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color ?? "currentColor" }}
          />
          <span>{item.value ?? item.dataKey}</span>
        </div>
      ))}
    </div>
  );
}