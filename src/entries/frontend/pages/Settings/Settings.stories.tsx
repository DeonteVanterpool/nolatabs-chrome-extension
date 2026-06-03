import type { Meta, StoryObj } from "@storybook/react-webpack5";
 
import Settings from "./Settings";

import "./Settings.css";
 
const meta = {
  component: Settings,
} satisfies Meta<typeof Settings>;
 
type Story = StoryObj<typeof meta>;
 
export const Primary: Story = {
  args: {
  },
};

export default meta;
