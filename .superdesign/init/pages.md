# Page dependency trees
## DashboardHome
Entry: src/screens/DashboardScreen.js
- src/components/Screen.js (section tint bg) -> src/components/PatternBackground.js, GlassBlur.js
- src/components/ScreenHeader.js (HEADER_HEIGHT_LARGE_NO_BACK constant)
- src/components/PressableScale.js, Icon.js, EmptyState.js
- src/components/MetricCard.js -> Waveform.js, theme/color.js
- src/components/StackedList.js -> GlassBlur.js
- src/components/Glass.js (GlassCard)
- src/components/DashboardWidgets.js (DonutChart, HealthBar, DataTable) -> GlassBlur.js, hooks/useTween
- src/components/TabBar.js (useTabBarClearance), AppHeader.js (persistent chrome, rendered in MainTabNavigator)
- src/theme/index.js, theme/motion.js
- src/data/dashboardData.js (sample data shape)
