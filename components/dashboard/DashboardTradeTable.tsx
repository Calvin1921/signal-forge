"use client";

import { MonospaceValue } from "@/components/ui/MonospaceValue";
import { RMultipleBadge } from "@/components/RMultipleBadge";
import { sampleTrades } from "@/lib/seed-data";

export function DashboardTradeTable() {
  // Show the 10 most recent trades from seed data
  const trades = sampleTrades.slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-secondary">
            <th className="text-left py-2 px-3 font-medium text-caption-1 uppercase tracking-wider">Time</th>
            <th className="text-left py-2 px-3 font-medium text-caption-1 uppercase tracking-wider">Strategy</th>
            <th className="text-left py-2 px-3 font-medium text-caption-1 uppercase tracking-wider">Side</th>
            <th className="text-right py-2 px-3 font-medium text-caption-1 uppercase tracking-wider">P&L</th>
            <th className="text-right py-2 px-3 font-medium text-caption-1 uppercase tracking-wider">R-Mult</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const isProfit = trade.pnl > 0;

            return (
              <tr key={trade.id} className={isProfit ? "row-profit" : "row-loss"}>
                <td className="py-2 px-3">
                  <MonospaceValue
                    value={trade.time}
                    sentiment="neutral"
                    className="text-subhead"
                  />
                </td>
                <td className="py-2 px-3">
                  <span className="text-subhead text-primary">{trade.strategy}</span>
                </td>
                <td className="py-2 px-3">
                  <span
                    className="text-subhead"
                    style={{
                      color:
                        trade.side === "Long"
                          ? "var(--semantic-profit)"
                          : "var(--semantic-loss)",
                    }}
                  >
                    {trade.side}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <MonospaceValue
                    value={`${isProfit ? "+" : ""}$${trade.pnl.toFixed(2)}`}
                    sentiment={isProfit ? "profit" : "loss"}
                    className="text-subhead font-medium"
                  />
                </td>
                <td className="py-2 px-3 text-right">
                  <RMultipleBadge value={trade.rMultiple} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
