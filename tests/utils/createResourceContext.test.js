import { describe, it, expect } from "vitest";
import { createResourceContext } from "@/lib/utils/createResourceContext";

describe("createResourceContext", () => {
  it("คืน { Provider, useResource } ที่เป็น function", () => {
    const { Provider, useResource } = createResourceContext("/api/test");
    expect(typeof Provider).toBe("function");
    expect(typeof useResource).toBe("function");
  });

  it("รองรับ options ครบ (reorderEndpoint, onAfterLoad, onAfterMutate)", () => {
    const onAfterLoad = () => {};
    const onAfterMutate = () => {};
    const { Provider, useResource } = createResourceContext("/api/test", {
      reorderEndpoint: "/api/test/reorder",
      onAfterLoad,
      onAfterMutate,
    });
    expect(typeof Provider).toBe("function");
    expect(typeof useResource).toBe("function");
  });

  it("factory เรียกซ้ำสร้าง Provider คนละ instance", () => {
    const { Provider: A } = createResourceContext("/api/a");
    const { Provider: B } = createResourceContext("/api/b");
    expect(A).not.toBe(B);
  });
});
