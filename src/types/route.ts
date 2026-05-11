import type { ReactNode } from "react";

export type UserRouteProps =
  | {
      action: "protect";
      children: ReactNode;
    }
  | {
      action: "redirect";
      section?: "todos" | "posts" | "albums";
    }
  | {
      action: "active-user";
      section: "todos" | "posts" | "albums";
      children: ReactNode;
    };
