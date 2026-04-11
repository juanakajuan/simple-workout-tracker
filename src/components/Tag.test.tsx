import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Tag } from "./Tag";

describe("Tag", () => {
  it("uses the requested variant class when no muscle group is provided", () => {
    const { rerender } = render(<Tag>Muted</Tag>);

    expect(screen.getByText("Muted").className).toContain("tag-muted");

    rerender(<Tag variant="accent">Accent</Tag>);
    expect(screen.getByText("Accent").className).toContain("tag-accent");

    rerender(<Tag variant="default">Default</Tag>);
    expect(screen.getByText("Default").className).toContain("tag-default");
  });

  it("uses the muscle-group class instead of the variant class", () => {
    render(
      <Tag variant="accent" muscleGroup="back">
        Back
      </Tag>
    );

    const tag = screen.getByText("Back");

    expect(tag.className).toContain("tag-muscle-back");
    expect(tag.className).not.toContain("tag-accent");
  });
});
