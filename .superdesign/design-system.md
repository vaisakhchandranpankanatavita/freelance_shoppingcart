# Design System — Supermarket Inventory App (mobile, ~390px wide)

## Product
Owner/manager app for a supermarket: stock, purchase, sale, reports. Dashboard = what the owner checks first: stock value, sales/revenue/footfall KPIs, low-stock alerts, stock composition. Currency INR (₹, en-IN grouping, ₹K/₹L shorthand).

## Look & feel
Calm, warm, glassy. Warm linen canvas gradient (#F8F4EE -> #EEE8DF) with soft pastel aura orbs at top (Dashboard: mint->sage #BFF0D6 #DDEFC9 #C9DDB8). Surfaces are frosted glass: rgba(255,255,255,0.62), 1px border rgba(255,255,255,0.85), backdrop blur, soft shadow (0 2 6 @6%). Rounded corners 12-16.

## Color
text/ink #050504; muted #5C5E58; faint #8B8D84; hairline #E6E2D9. Accent forest sage #59664C (strong #3D4634). Primary CTA / dock warm grey #8A807F (white text). Success #1ED58A (text #0A7A4C). Danger #F2484E (text #A82A22). Warning #FFB020 (text #9C4D00).
Chart palette in order: sage #59664C, mint #1ED58A, mustard #F2B33D, coral #F2484E, violet #8B7CF6, slate #9A9AA5. Waveform/gauge gradients: green #1ED58A->#9BBF7A; cyan #9BBF7A->#59664C; red #F2484E->#FF7A59.

## Typography
Outfit 700 for headlines and big figures (hero 40px, ls -1.2; section titles 16-18px ls -0.4); Inter 400/500/600/700 for body (13-15), labels/captions (11-12). No other fonts.

## Spacing / radius / elevation
Spacing 4/8/12/16/24/32, screen gutter 16. Radius 8/12/16/20/pill. Shadows sm/md/lg (black 6%/12%/16%).

## Components
Hero glass card; metric cards with animated vertical-bar waveform + circular outlined badge; stacked glass list rows (58px, circle outlined icon, name + muted meta, right-aligned value); segmented stock health bar; donut with legend; compact data table with mini progress bars; floating bottom dock (grey #8A807F, 5 tabs + quick actions) and persistent top app header (title + menu icon); pull-to-refresh; error empty state.

## Motion
Soft: FadeInDown 160ms on blocks, bars grow 900ms ease-out, donut sweeps 1.1s, waveform loops, cards scale/dim in carousel. Respect reduced motion.
