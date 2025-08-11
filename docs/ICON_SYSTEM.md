# Icon System Documentation

## Overview
The SharedTable Mobile app uses a carefully curated icon system following the design guidelines from Figma, with consistent stroke weights and visual balance.

## Icon Guidelines

### Design Rules (From Figma)
- **Stroke Weight**: 1-2px (we use 1.5px for optimal display)
- **Consistent Padding**: 8px around icons for visual balance
- **Touch Target**: Minimum 44px for interactive icons
- **Default Size**: 24px

### Icon Library
We primarily use **Feather Icons** for their:
- Consistent 2px stroke weight
- Clean, minimal aesthetic
- Wide variety of icons
- Perfect match with our design language

## Available Icons

### Core UI Icons (Matching Figma Design)
- `light-bulb` - Ideas/Tips
- `settings` - Settings
- `bell` - Notifications  
- `mail` - Messages
- `star` - Favorites
- `calendar` - Events
- `search` - Search
- `heart` - Likes
- `trash` - Delete
- `trophy` - Achievements
- `flame` - Trending/Hot

### Navigation Icons
- `home` - Home navigation
- `menu` - Menu/hamburger
- `close` - Close/X
- `back` - Back arrow
- `forward` - Forward arrow
- `chevron-down/up/left/right` - Directional chevrons

### Action Icons
- `add` - Plus sign
- `edit` - Edit/pencil
- `save` - Save
- `share` - Share
- `filter` - Filter
- `sort` - Sort/list
- `refresh` - Refresh
- `more-horizontal` - Horizontal dots
- `more-vertical` - Vertical dots

### Status & Feedback Icons
- `check` - Checkmark
- `x` - X/close
- `alert-circle` - Alert
- `info` - Information
- `check-circle` - Success
- `x-circle` - Error

### User & Social Icons
- `user` - Single user
- `users` - Multiple users
- `user-plus` - Add user
- `user-check` - User verified
- `message-circle` - Chat
- `camera` - Camera
- `image` - Image/photo

### Location & Time Icons
- `map-pin` - Location pin
- `map` - Map
- `clock` - Time
- `calendar` - Calendar

### Food & Dining Icons
- `restaurant` - Restaurant
- `coffee` - Coffee cup

### Commerce Icons
- `ticket` - Ticket/tag
- `credit-card` - Payment
- `gift` - Gift
- `shopping-bag` - Shopping

### Communication Icons
- `phone` - Phone
- `mail` - Email
- `message-square` - Message
- `send` - Send

## Usage Examples

### Basic Icon
```tsx
import { Icon } from '@/components/base';

<Icon name="heart" size={24} color="#E24843" />
```

### Icon with Padding
```tsx
<Icon 
  name="settings" 
  size={24} 
  withPadding={true}  // Adds 8px padding
/>
```

### Custom Stroke Weight
```tsx
<Icon 
  name="search" 
  strokeWidth={2}  // For Feather icons only
/>
```

### Icon Button
```tsx
import { IconButton } from '@/components/base';

<IconButton
  name="heart"
  onPress={() => handleLike()}
  backgroundColor="#FEE5E5"
  size={24}
/>
```

### Disabled Icon Button
```tsx
<IconButton
  name="trash"
  onPress={handleDelete}
  disabled={!canDelete}
  color="#8B8B8B"
/>
```

## Icon Sizing Guide

| Size Name | Pixels | Use Case |
|-----------|--------|----------|
| Small | 16px | Inline text icons, badges |
| Default | 24px | Most UI elements |
| Medium | 32px | Prominent actions |
| Large | 40px | Hero sections |

## Color Usage

Icons should use colors from our design system:
- **Primary Actions**: `#E24843` (brand red)
- **Default**: `#1F2024` (black 2)
- **Disabled**: `#8B8B8B` (gray 3)
- **Inverse**: `#FFFFFF` (on dark backgrounds)

## Best Practices

1. **Consistency**: Always use icons from the same family (prefer Feather)
2. **Touch Targets**: Ensure 44px minimum touch area for interactive icons
3. **Padding**: Use `withPadding` prop for icons that need visual breathing room
4. **Accessibility**: Icons should have proper labels when used alone
5. **Performance**: Icons are memoized for optimal performance

## Adding New Icons

If you need an icon not in the current set:

1. Check if Feather Icons has it first
2. If not available, check Ionicons (for platform-specific icons)
3. Add to the `iconMap` in `src/components/base/Icon.tsx`
4. Update this documentation

## Icon Alternatives

For icons not available in our libraries, here are the mappings:
- `light-bulb` → `zap` (Feather)
- `flame` → Ionicons flame (no Feather equivalent)
- `restaurant` → Ionicons restaurant (food-specific)

## Platform Considerations

- **iOS**: Haptic feedback enabled on icon buttons
- **Android**: Material ripple effect on press
- Both platforms respect the minimum touch target sizes