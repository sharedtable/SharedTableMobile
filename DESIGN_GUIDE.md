# SharedTable Mobile Design Guide

## 🎨 Design Philosophy

SharedTable Mobile follows a **modern, clean, and accessible** design language that prioritizes:
- **Clarity**: Information hierarchy and intuitive navigation
- **Consistency**: Unified design patterns across all screens
- **Performance**: Smooth animations and instant feedback
- **Accessibility**: WCAG 2.1 AA compliance

## 📐 Design Tokens

### Color System (From Figma Design)

#### Brand Colors
- **Primary**: `#E24843` - Main brand color for CTAs, links, and primary actions

#### State Colors
- **Info**: `#BEE5EB` - Information states, notifications
- **Action**: `#3A3C88` - Secondary actions, interactive elements

#### Black Colors
- **Black 1**: `#000000` - Pure black for high contrast
- **Black 2**: `#1F2024` - Primary text color

#### White & Extra
- **White**: `#FFFFFF` - Background, contrast text
- **Extra**: `#363636` - Special use cases, secondary text

#### Gray Colors
- **Gray 1**: `#D9D9D9` - Light borders, dividers
- **Gray 2**: `#C0C0C0` - Disabled states
- **Gray 3**: `#8B8B8B` - Placeholder text
- **Gray 4**: `#252525` - Dark backgrounds

### Typography (From Figma Design)

#### Font Families
- **Keania One**: Display font for headings and hero text (Google Font)
- **Inter**: Body text and UI elements (Google Font)

#### Font Sizes
- **xs**: 12px - Captions, labels
- **sm**: 14px - Secondary text, hints
- **base**: 16px - Body text (default)
- **lg**: 18px - Subheadings
- **xl**: 20px - Section headers
- **2xl**: 24px - Page titles
- **3xl**: 30px - Large headers
- **4xl**: 36px - Hero text
- **5xl**: 48px - Display text
- **6xl**: 60px - Extra large display

#### Font Weights (Inter)
- **Thin**: 100
- **Light**: 300
- **Regular**: 400 - Body text
- **Medium**: 500 - Emphasized text
- **SemiBold**: 600 - Subheadings
- **Bold**: 700 - Headers, CTAs
- **ExtraBold**: 800
- **Black**: 900

#### Line Heights
- **Tight**: 1.1 - Display headings (Keania One)
- **Snug**: 1.2 - Headers
- **Normal**: 1.5 - Body text
- **Relaxed**: 1.75 - Long-form content
- **Loose**: 2.0 - Spacious text

### Spacing System

Based on 4px grid:
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

### Border Radius
- **sm**: 4px - Small elements
- **md**: 8px - Buttons, inputs
- **lg**: 12px - Cards
- **xl**: 16px - Modals
- **full**: 9999px - Pills, avatars

### Shadows
- **sm**: Subtle elevation (buttons)
- **md**: Card elevation
- **lg**: Modal/dropdown elevation
- **xl**: High elevation (overlays)

## 🧩 Component Guidelines

### Buttons

#### Primary Button
- Background: Primary Main
- Text: White
- Border Radius: 8px
- Height: 48px (default), 40px (small)
- Padding: 16px horizontal
- Font: Semibold, 16px

#### Secondary Button
- Background: Transparent
- Border: 1px solid Primary Main
- Text: Primary Main
- Same sizing as Primary

#### Text Button
- Background: None
- Text: Primary Main
- No border
- Underline on hover

### Input Fields

#### Text Input
- Height: 48px
- Border: 1px solid Gray 200
- Border Radius: 8px
- Padding: 12px
- Focus: Primary Main border
- Error: Error Main border

#### Labels
- Font: Medium, 14px
- Color: Gray 700
- Margin Bottom: 8px

#### Helper Text
- Font: Regular, 12px
- Color: Gray 500
- Error Color: Error Main

### Cards

#### Event Card
- Background: White
- Border Radius: 12px
- Padding: 16px
- Shadow: md
- Active: Scale 0.98

#### List Item
- Background: White
- Padding: 16px
- Border Bottom: 1px solid Gray 100
- Active: Gray 50 background

### Navigation

#### Tab Bar
- Height: 56px + Safe Area
- Background: White
- Shadow: Reverse sm
- Active Color: Primary Main
- Inactive Color: Gray 400

#### Header
- Height: 56px + Status Bar
- Background: White
- Shadow: sm
- Title: Bold, 18px

## 📱 Responsive Design

### Screen Breakpoints
- Small: 320px - 374px
- Medium: 375px - 413px (iPhone standard)
- Large: 414px+ (Plus/Max phones)

### Safe Areas
- Always respect device safe areas
- Bottom padding: Tab bar + safe area
- Top padding: Status bar + safe area

### Touch Targets
- Minimum: 44x44px (iOS) / 48x48px (Android)
- Recommended: 48x48px
- Spacing between targets: 8px minimum

## ⚡ Animation Guidelines

### Durations
- **Instant**: 100ms - Micro interactions
- **Fast**: 200ms - Transitions
- **Normal**: 300ms - Page transitions
- **Slow**: 500ms - Complex animations

### Easing Functions
- **Standard**: ease-in-out - Most animations
- **Decelerate**: ease-out - Enter animations
- **Accelerate**: ease-in - Exit animations
- **Spring**: Custom spring - Playful interactions

### Common Animations
- **Fade**: Opacity 0 → 1
- **Scale**: Scale 0.95 → 1
- **Slide**: TranslateY 100% → 0
- **Press**: Scale 1 → 0.98

## ♿ Accessibility

### Text Contrast
- Normal Text: 4.5:1 minimum
- Large Text: 3:1 minimum
- Interactive Elements: 3:1 minimum

### Touch Accessibility
- All interactive elements must have:
  - accessibilityRole
  - accessibilityLabel
  - accessibilityHint (when needed)

### Screen Reader Support
- Logical reading order
- Descriptive labels
- State announcements

## 🎯 Platform-Specific Guidelines

### iOS
- Use SF Symbols when available
- Respect iOS gestures (swipe back)
- Follow Human Interface Guidelines
- Support Dynamic Type

### Android
- Use Material Design icons
- Implement proper back button handling
- Follow Material Design guidelines
- Support system font scaling

## 📏 Grid System

### Layout Grid
- Columns: 12
- Gutter: 16px
- Margin: 16px

### Component Spacing
- Between sections: 24px
- Between related items: 16px
- Between unrelated items: 32px
- Internal padding: 16px

## 🔤 Content Guidelines

### Tone of Voice
- **Friendly**: Warm and approachable
- **Clear**: Simple, jargon-free language
- **Concise**: Get to the point quickly
- **Helpful**: Guide users to success

### Error Messages
- Be specific about what went wrong
- Provide actionable next steps
- Use positive language when possible
- Keep it brief

### Empty States
- Explain what the screen is for
- Guide users to take action
- Use illustrations when appropriate
- Keep messaging optimistic

## 🚀 Performance Guidelines

### Image Optimization
- Use WebP format when possible
- Provide 1x, 2x, 3x versions
- Lazy load below the fold
- Maximum file size: 200KB

### Loading States
- Show skeleton screens for lists
- Use progressive loading
- Provide instant feedback
- Optimize perceived performance

## 📋 Checklist for New Screens

Before implementing any new screen:

- [ ] Define information hierarchy
- [ ] Choose appropriate components from the design system
- [ ] Ensure touch targets meet minimum size
- [ ] Add proper accessibility labels
- [ ] Test on both iOS and Android
- [ ] Verify color contrast ratios
- [ ] Add loading and error states
- [ ] Include empty state design
- [ ] Test with different text sizes
- [ ] Verify offline behavior

## 🔄 Version History

### v1.0.0 (Current)
- Initial design system setup
- Core component definitions
- Color and typography scales
- Accessibility guidelines

---

This design guide is a living document and should be updated as the design system evolves.