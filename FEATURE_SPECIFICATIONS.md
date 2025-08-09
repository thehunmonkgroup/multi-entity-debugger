# Feature Specifications

This document outlines the specifications for selected feature enhancements to the Multi-entity Debugger.

## Feature 1: Message Filtering/Search

### Overview
Add client-side filtering capabilities to allow users to search through messages and filter by log levels.

### UI Components
- **Search Input Field**: Text input in the messages header area
- **Log Level Filter**: Dropdown/checkboxes for log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL, None)
- **Clear Filters Button**: Reset all filters to show all messages

### Functionality
- **Text Search**: Case-insensitive search across all message fields (message, timestamp, custom fields)
- **Log Level Filter**: Show/hide messages based on selected log levels
- **Real-time Filtering**: Apply filters to both existing and new incoming messages
- **Visual Indicators**: Show filter status (e.g., "Showing 15 of 100 messages")
- **Persistence**: Remember filter settings per entity (cleared on page refresh)

### Technical Implementation
- Client-side filtering using JavaScript array methods
- Filter state stored per entity in the messages object structure
- Update Backbone views to respect filter state when rendering
- Filter logic applied in message display, not data storage (preserve all messages)

### User Experience
- Filters apply only to the currently selected entity
- New messages matching filters automatically appear
- Non-matching messages are hidden but not removed from memory
- Clearing filters shows all messages for the current entity

---

## Feature 3: Auto-scroll Toggle

### Overview
Allow users to control whether the message view automatically scrolls to show new messages or maintains current scroll position.

### UI Components
- **Toggle Button**: In messages header, shows "Auto-scroll: ON/OFF" with icon
- **Visual Indicator**: Button styling indicates current state (active/inactive)

### Functionality
- **Default State**: Auto-scroll enabled by default
- **Toggle Behavior**: Click to enable/disable auto-scroll
- **Scroll Logic**: 
  - When ON: New messages cause automatic scroll to bottom
  - When OFF: New messages added without changing scroll position
- **Smart Behavior**: If user manually scrolls to bottom, re-enable auto-scroll
- **Per-Entity Setting**: Auto-scroll state is per entity, not global

### Technical Implementation
- Track scroll position of messages container
- Detect when user manually scrolls (disable auto-scroll if scrolled up)
- On new message arrival, check auto-scroll state before scrolling
- Store auto-scroll state per entity in JavaScript

### User Experience
- Clear visual feedback of current auto-scroll state
- Intuitive behavior that respects user intent
- Auto-scroll re-enables when user shows intent to see latest messages

---

## Feature 8: Enhanced Timestamps

### Overview
Display both relative time (e.g., "2 minutes ago") and absolute timestamps for better temporal context.

### UI Components
- **Relative Time Display**: Primary timestamp showing relative time
- **Absolute Time Tooltip**: Hover to see exact timestamp
- **Time Format**: Consistent formatting across all messages

### Functionality
- **Relative Time Calculation**: Show "just now", "X seconds/minutes/hours ago", "yesterday", etc.
- **Update Frequency**: Refresh relative times every 30 seconds for visible messages
- **Fallback Display**: Show absolute time for messages older than 24 hours
- **Timezone Handling**: Display times in user's local timezone

### Technical Implementation
- JavaScript function to calculate relative time from timestamp
- Periodic update of visible relative timestamps using setInterval
- Moment.js or similar library for robust time handling (check if already used)
- Update message template to show relative time with absolute time in title attribute

### User Experience
- Quick temporal context with relative times
- Precise timing available on hover
- Automatic updates keep information current
- Consistent time display across all messages

---

## Feature 9: Entity Statistics

### Overview
Display message counts and rates for each entity to help monitor system activity and health.

### UI Components
- **Entity Badge**: Show message count next to entity name
- **Statistics Tooltip**: Hover for detailed stats (total messages, messages per minute, last message time)
- **Visual Indicators**: Color-coding or styling based on activity level

### Functionality
- **Message Counting**: Track total messages per entity
- **Rate Calculation**: Calculate messages per minute over configurable window (default: last 10 minutes)
- **Activity Indicators**: Visual cues for high/low activity entities
- **Real-time Updates**: Statistics update as new messages arrive

### Technical Implementation
- Extend entity model to include statistics properties
- Track message timestamps for rate calculations
- Update statistics on message arrival
- Sliding window calculation for message rates
- Update entity view to display statistics

### User Experience
- Quick visual assessment of entity activity levels
- Detailed statistics available on demand
- Helps identify busy or silent entities at a glance
- Useful for system monitoring and debugging

---

## Feature 10: Keyboard Shortcuts

### Overview
Add keyboard shortcuts for common actions to improve user efficiency.

### Keyboard Shortcuts
- **Ctrl/Cmd + F**: Focus search input (Feature 1)
- **Ctrl/Cmd + K**: Clear messages for current entity
- **Ctrl/Cmd + Shift + K**: Clear all messages for all entities
- **S**: Toggle auto-scroll for current entity
- **D**: Toggle dark mode (Feature 11)
- **Escape**: Clear search input and filters
- **Ctrl/Cmd + 1-9**: Quick jump to entity by position (supplement existing number keys)

### UI Components
- **Keyboard Shortcuts Help**: Modal or tooltip showing available shortcuts
- **Help Trigger**: "?" key or help icon to show shortcuts

### Functionality
- **Global Shortcuts**: Work regardless of current focus (except when typing in inputs)
- **Context Awareness**: Some shortcuts only work when relevant (e.g., clear search when search is active)
- **Visual Feedback**: Brief indication when shortcut is used
- **Modifier Keys**: Use standard conventions (Ctrl on Windows/Linux, Cmd on Mac)

### Technical Implementation
- Event listeners for keydown events on document
- Check for modifier keys and prevent conflicts with browser shortcuts
- Integrate with existing keyboard navigation system
- Add help modal/tooltip component

### User Experience
- Power user efficiency improvements
- Discoverable through help system
- Standard keyboard conventions
- Non-intrusive for users who prefer mouse interaction

---

## Feature 11: Dark Mode Theme

### Overview
Implement a dark color scheme to reduce eye strain during extended debugging sessions.

### UI Components
- **Theme Toggle**: Button in header or settings area to switch themes
- **Theme Persistence**: Remember user preference across sessions

### Visual Design
- **Dark Background**: Dark gray/black backgrounds for main areas
- **Light Text**: White/light gray text for readability
- **Accent Colors**: Maintain log level color coding with dark-appropriate variations
- **Contrast Compliance**: Ensure WCAG contrast requirements are met
- **Entity Buttons**: Adapt entity link styling for dark theme

### Color Scheme
- **Background**: `#1a1a1a` (main), `#2d2d2d` (cards/messages)
- **Text**: `#ffffff` (primary), `#cccccc` (secondary)
- **Borders**: `#444444`
- **Log Level Colors**: Adjusted versions of existing colors for dark backgrounds
- **Accent**: Keep existing blue theme for entities but darker variants

### Functionality
- **Toggle Mechanism**: Click to switch between light and dark themes
- **System Preference Detection**: Respect user's OS dark mode preference by default
- **Persistence**: Store preference in localStorage
- **Smooth Transition**: CSS transitions for theme switching

### Technical Implementation
- CSS custom properties (variables) for theme colors
- JavaScript to toggle theme class on body element
- CSS transitions for smooth theme switching
- localStorage to persist theme preference
- Media query to detect system preference

### User Experience
- Reduced eye strain in low-light environments
- Familiar dark mode conventions
- Smooth transition between themes
- Persistent user preference