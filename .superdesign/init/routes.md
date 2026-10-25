# Routes (React Navigation)
Root -> Auth stack | Drawer? -> MainTabNavigator (bottom tabs, custom TabBar + AppHeader + QuickActionsSheet).
- Tab `Dashboard` -> DashboardNavigator (native stack): `DashboardHome` = `src/screens/DashboardScreen.js` (target of this redesign); `MetricDetail` = `src/screens/MetricDetailScreen.js` (gauge per branch/period).
- Tabs `Stock`, `Purchase`, `Sale` (modules/*), `More`.
Each tab's Screen is wrapped by `Screen` which paints the section tint background. See layouts.md for MainTabNavigator + DashboardNavigator source.

## DashboardHome renders (top -> bottom)
1. Hero glass card: "Stock value" big number (Outfit 40), tone badge icon, subtitle, animated Waveform. Tap -> Stock.
2. Horizontal snap carousel of 2-up MetricCards (Sales bills, Revenue, Low stock, Footfall…): value+unit, badge, waveform, title, subtitle.
3. "Needs restocking" collapsible StackedList (alert icon, name, category, "N unit left"/"Out of stock").
4. "Stock composition" glass panel: HealthBar (In stock/Low/Out), DonutChart "Where the value sits" w/ legend, DataTable "Category breakdown" w/ mini bars.
5. "Most stock value" StackedList (basket icon, name, qty in stock, ₹value).
Pull-to-refresh; error EmptyState. Data shape: src/data/dashboardData.js (sample) / modules/dashboard/services.
