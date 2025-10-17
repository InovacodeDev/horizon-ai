/**
 * Badge Component Examples
 *
 * Demonstrates the usage of the MD3 Badge component with various configurations.
 */

import { Badge } from "../badge";
import { Button } from "../button";
import { Bell, Mail, ShoppingCart, AlertCircle } from "lucide-react";

export function BadgeExamples() {
  return (
    <div className="space-y-8 p-8">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Badge Variants</h2>
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-sm mb-2">Standard Badge</p>
            <Badge content={5}>
              <Button variant="outlined" icon={<Bell />}>
                Notifications
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Dot Badge</p>
            <Badge variant="dot">
              <Button variant="outlined" icon={<Mail />}>
                Messages
              </Button>
            </Badge>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Color Variants</h2>
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-sm mb-2">Primary</p>
            <Badge color="primary" content={3}>
              <Button variant="outlined" icon={<Mail />}>
                Messages
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Secondary</p>
            <Badge color="secondary" content={7}>
              <Button variant="outlined" icon={<Bell />}>
                Updates
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Error (Default)</p>
            <Badge color="error" content={10}>
              <Button variant="outlined" icon={<AlertCircle />}>
                Errors
              </Button>
            </Badge>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Max Value Truncation</h2>
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-sm mb-2">Below Max (50)</p>
            <Badge content={50} max={99}>
              <Button variant="outlined" icon={<Bell />}>
                Notifications
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">At Max (99)</p>
            <Badge content={99} max={99}>
              <Button variant="outlined" icon={<Bell />}>
                Notifications
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Above Max (150)</p>
            <Badge content={150} max={99}>
              <Button variant="outlined" icon={<Bell />}>
                Notifications
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Custom Max (9)</p>
            <Badge content={50} max={9}>
              <Button variant="outlined" icon={<Bell />}>
                Notifications
              </Button>
            </Badge>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">String Content</h2>
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-sm mb-2">Text Badge</p>
            <Badge content="NEW">
              <Button variant="outlined" icon={<Mail />}>
                Messages
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Short Text</p>
            <Badge content="!">
              <Button variant="outlined" icon={<AlertCircle />}>
                Alerts
              </Button>
            </Badge>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Invisible Badge</h2>
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-sm mb-2">Visible</p>
            <Badge content={5} invisible={false}>
              <Button variant="outlined" icon={<Bell />}>
                Notifications
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Invisible</p>
            <Badge content={5} invisible={true}>
              <Button variant="outlined" icon={<Bell />}>
                Notifications
              </Button>
            </Badge>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Different Child Elements</h2>
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-sm mb-2">Icon Button</p>
            <Badge content={3}>
              <Button variant="filled" size="icon">
                <ShoppingCart />
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Avatar</p>
            <Badge variant="dot" color="primary">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--md-sys-color-primary-container))] flex items-center justify-center">
                <span className="text-[hsl(var(--md-sys-color-on-primary-container))]">JD</span>
              </div>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Custom Element</p>
            <Badge content={99} color="error">
              <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
                <Mail className="w-6 h-6" />
              </div>
            </Badge>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Accessibility</h2>
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-sm mb-2">Default aria-label</p>
            <Badge content={5}>
              <Button variant="outlined" icon={<Bell />}>
                Notifications
              </Button>
            </Badge>
          </div>

          <div>
            <p className="text-sm mb-2">Custom aria-label</p>
            <Badge content={3} aria-label="3 unread messages">
              <Button variant="outlined" icon={<Mail />}>
                Messages
              </Button>
            </Badge>
          </div>
        </div>
      </section>
    </div>
  );
}
