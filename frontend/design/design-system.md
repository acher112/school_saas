# SchoolSaaS Cloud Design System Specification

## 1. Brand & Palette Tokens
Engineered for Pakistani Educational Institutions with high contrast (WCAG AA compliance) in both Light and Dark themes.

### 1.1 Color Tokens
- **Brand Primary**:
  - `indigo-600` (`#4f46e5`) to `purple-600` (`#7c3aed`)
  - Accent / Glow: `rgba(99, 102, 241, 0.25)`
- **Background & Surfaces**:
  - **Dark Mode (Default Dashboard)**:
    - Main Background: Deep Navy/Slate `#0b0f19` (`rgb(11, 15, 25)`)
    - Surface / Cards: `#161e31` / `#1a2238`
    - Elevated Cards: `#1e293b`
    - Borders: `rgba(255, 255, 255, 0.08)` / `#25304b`
    - Text Primary: `#ffffff`
    - Text Secondary: `#94a3b8` (Slate 400)
    - Text Muted: `#64748b` (Slate 500)
  - **Light Mode (Default Landing Page)**:
    - Main Background: `#f8fafc` (Slate 50) with subtle purple/indigo top glow
    - Surface / Cards: `#ffffff`
    - Elevated Cards: `#ffffff` with shadow `0 10px 25px -5px rgba(0, 0, 0, 0.05)`
    - Borders: `#e2e8f0` (Slate 200)
    - Text Primary: `#0f172a` (Slate 900)
    - Text Secondary: `#475569` (Slate 600)
    - Text Muted: `#94a3b8` (Slate 400)
- **Status & Metric Accents**:
  - **Emerald / Success**: `#10b981` (Students growth, Biometric online, Active campus bar)
  - **Cyan / Electric Blue**: `#06b6d4` (Attendance Today radial gauge, Challan sparklines)
  - **Amber / Warning**: `#f59e0b` (Pending staff leaves, Test environment banner)
  - **Rose / Danger**: `#f43f5e` (Fee defaulters count, critical alerts)
  - **Purple / Finance**: `#8b5cf6` (Monthly fees collected, Challan vouchers)

### 1.2 Typography
- **English**: Inter / system sans-serif font stack.
  - Heading 1: 36px / 48px, font-black (900), tracking-tight
  - Heading 2: 24px / 30px, font-extrabold (800)
  - Stat Numbers: 28px - 32px, font-bold (700)
  - Body: 14px, font-normal (400) / font-medium (500)
  - Micro / Labels: 11px - 12px, font-semibold (600), uppercase tracking-wider
- **Urdu Nastaliq**:
  - Font family: `'Noto Nastaliq Urdu', 'Gulzar', -apple-system, sans-serif`
  - Bi-directional support with `dir="rtl"`
  - Proper line-height (1.9x - 2.2x) to prevent vertical glyph clipping.

---

## 2. Component Specifications

### 2.1 Top Environment Banner
- Amber 500 border with soft translucent background:
  - English: `⚠️ Test environment. Do not enter real student data.`
  - Urdu: `یہ امتحانی ماحول ہے۔ اصلی ڈیٹا داخل نہ کریں۔`

### 2.2 Collapsible Sidebar (`AppSidebar`)
- Header: SchoolSaaS Cloud purple mortarboard icon + school name.
- Profile Card: User avatar circle with initial, user full name, user role badge (super-admin, headmaster, teacher, accountant, student, parent).
- Navigation Items:
  - Active: Solid Indigo pill (`#6366f1` / `#4f46e5`) with white text and glow.
  - Inactive: Slate 400 hover to Slate 100 with smooth transitions.
  - Icons: Lucide React icons (LayoutDashboard, GraduationCap, Users, CreditCard, CalendarCheck, Building2, ShieldCheck, Settings, LogOut).
- Bottom: Sign Out button with confirmation handler.

### 2.3 Top Bar (`AppHeader`)
- Left: Breadcrumb / Section title ("Dashboard Overview • Welcome back, {Name}!").
- Center: Quick search input with magnifying glass shortcut indicator.
- Right:
  - Notification bell with unread indicator badge.
  - Urdu RTL toggle switch (`اردو RTL`).
  - Dark / Light mode toggle.
  - User avatar bubble with drop-down profile menu.

### 2.4 Metric Stat Cards
- Layout: 4 columns on desktop, 2 columns on tablet, 1 column on mobile.
- Features:
  - Card 1: Total Students with emerald `+4%` delta badge and green users icon.
  - Card 2: Total Teachers & Staff with orange team icon.
  - Card 3: Monthly Fees Collected (`PKR 4.8M`) with purple credit card badge.
  - Card 4: Attendance Today (`94.2%`) with cyan radial circular gauge and clock badge.

### 2.5 Data Visualizations
- **Radial Circular Progress Gauge**: Custom SVG path calculation rendering 94.2% arc with electric cyan stroke.
- **Sparkline Curve**: Smooth SVG bezier curve with gradient fill below curve for online challans payment trend.
- **Grouped Bar Chart**: Responsive SVG bar chart comparing PKR collection vs Student registrations across Jan - Jun.
- **Campus Health Indicators**: Karachi, Lahore, Islamabad with progress bars and glowing status dots.
- **Activity Log Feed**: Real-time audit events with timestamp and status indicators.
