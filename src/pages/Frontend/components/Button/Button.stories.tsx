import type { Meta, StoryObj } from "@storybook/react-webpack5";
 
import Button from "./Button";

import "./Button.css";
 
const meta = {
  component: Button,
} satisfies Meta<typeof Button>;
 
type Story = StoryObj<typeof meta>;
 
export const Primary: Story = {
  args: {
    label: "Yes",
    style: "outlined"
  },
};

export default meta;
