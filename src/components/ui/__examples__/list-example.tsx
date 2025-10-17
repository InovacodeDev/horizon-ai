/**
 * List Component Examples
 *
 * This file demonstrates various use cases for the MD3 List components.
 */

import React from "react";
import { List, ListItem, Divider } from "../list";

// Example icons (replace with actual icons from your icon library)
const PersonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z" fill="currentColor" />
  </svg>
);
const EmailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path
      d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
      fill="currentColor"
    />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor" />
  </svg>
);

/**
 * Basic List Example
 */
export function BasicListExample() {
  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-lg font-medium">Basic List</h3>
      <List>
        <ListItem headline="One-line item" />
        <ListItem headline="Another item" />
        <ListItem headline="Third item" />
      </List>
    </div>
  );
}

/**
 * List with Dividers Example
 */
export function ListWithDividersExample() {
  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-lg font-medium">List with Dividers</h3>
      <List dividers>
        <ListItem headline="Item one" />
        <ListItem headline="Item two" />
        <ListItem headline="Item three" />
      </List>
    </div>
  );
}

/**
 * Two-line List Example
 */
export function TwoLineListExample() {
  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-lg font-medium">Two-line List</h3>
      <List dividers>
        <ListItem
          headline="Brunch this weekend?"
          supportingText="I'll be in your neighborhood doing errands this weekend."
        />
        <ListItem headline="Summer BBQ" supportingText="Wish I could come, but I'm out of town this weekend." />
        <ListItem headline="Oui oui" supportingText="Do you have Paris recommendations? Have you ever been?" />
      </List>
    </div>
  );
}

/**
 * Three-line List Example
 */
export function ThreeLineListExample() {
  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-lg font-medium">Three-line List</h3>
      <List dividers>
        <ListItem
          overline="OVERLINE"
          headline="Three-line item"
          supportingText="This is a longer supporting text that provides additional context about the list item."
        />
        <ListItem
          overline="CATEGORY"
          headline="Another item"
          supportingText="Supporting text can span multiple lines to provide more detailed information."
        />
      </List>
    </div>
  );
}

/**
 * List with Leading Icons Example
 */
export function ListWithLeadingIconsExample() {
  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-lg font-medium">List with Leading Icons</h3>
      <List dividers>
        <ListItem leading={<PersonIcon />} headline="Profile" supportingText="View and edit your profile" />
        <ListItem leading={<EmailIcon />} headline="Messages" supportingText="Check your inbox" />
      </List>
    </div>
  );
}

/**
 * List with Trailing Elements Example
 */
export function ListWithTrailingElementsExample() {
  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-lg font-medium">List with Trailing Elements</h3>
      <List dividers>
        <ListItem headline="Settings" trailing={<ChevronRightIcon />} />
        <ListItem
          headline="Notifications"
          supportingText="Manage your notifications"
          trailing={<span className="text-sm text-[hsl(var(--md-sys-color-on-surface-variant))]">3</span>}
        />
      </List>
    </div>
  );
}

/**
 * Interactive List Example
 */
export function InteractiveListExample() {
  const [selectedId, setSelectedId] = React.useState<string | null>("item-1");

  const items = [
    { id: "item-1", headline: "Inbox", count: 24 },
    { id: "item-2", headline: "Starred", count: 5 },
    { id: "item-3", headline: "Sent", count: 0 },
    { id: "item-4", headline: "Drafts", count: 3 },
  ];

  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-lg font-medium">Interactive List</h3>
      <List dividers>
        {items.map((item) => (
          <ListItem
            key={item.id}
            headline={item.headline}
            trailing={item.count > 0 ? <span className="text-sm">{item.count}</span> : undefined}
            interactive
            selected={selectedId === item.id}
            onClick={() => setSelectedId(item.id)}
          />
        ))}
      </List>
    </div>
  );
}

/**
 * Complex List Example
 */
export function ComplexListExample() {
  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-lg font-medium">Complex List</h3>
      <List dividers dividerInset>
        <ListItem
          leading={<PersonIcon />}
          overline="CONTACT"
          headline="John Doe"
          supportingText="john.doe@example.com"
          trailing={<ChevronRightIcon />}
          interactive
        />
        <ListItem
          leading={<PersonIcon />}
          overline="CONTACT"
          headline="Jane Smith"
          supportingText="jane.smith@example.com"
          trailing={<ChevronRightIcon />}
          interactive
        />
        <ListItem
          leading={<PersonIcon />}
          overline="CONTACT"
          headline="Bob Johnson"
          supportingText="bob.johnson@example.com"
          trailing={<ChevronRightIcon />}
          interactive
          disabled
        />
      </List>
    </div>
  );
}

/**
 * Standalone Divider Example
 */
export function DividerExample() {
  return (
    <div className="w-full max-w-md space-y-4">
      <h3 className="text-lg font-medium">Divider Variants</h3>

      <div>
        <p className="mb-2 text-sm">Horizontal Divider</p>
        <Divider />
      </div>

      <div>
        <p className="mb-2 text-sm">Divider with Inset</p>
        <Divider inset />
      </div>

      <div className="flex h-24">
        <div className="flex-1">
          <p className="mb-2 text-sm">Vertical Divider</p>
        </div>
        <Divider orientation="vertical" />
        <div className="flex-1 pl-4">
          <p className="text-sm">Content on the right</p>
        </div>
      </div>
    </div>
  );
}

/**
 * All Examples Combined
 */
export function AllListExamples() {
  return (
    <div className="space-y-8 p-8">
      <BasicListExample />
      <ListWithDividersExample />
      <TwoLineListExample />
      <ThreeLineListExample />
      <ListWithLeadingIconsExample />
      <ListWithTrailingElementsExample />
      <InteractiveListExample />
      <ComplexListExample />
      <DividerExample />
    </div>
  );
}
